package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.*;
import com.softedgex.agrisuite.repository.*;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private RefundRepository refundRepository;

    @Autowired
    private DealerSubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private PaymentGatewayService paymentGateway;

    @org.springframework.beans.factory.annotation.Value("${razorpay.key-id}")
    private String keyId;

    @org.springframework.beans.factory.annotation.Value("${razorpay.key-secret}")
    private String keySecret;

    public Map<String, Object> getRazorpayConfigDiagnostics() {
        Map<String, Object> check = new HashMap<>();
        check.put("keyIdValue", keyId != null ? (keyId.length() > 8 ? keyId.substring(0, 8) + "..." : keyId) : "null");
        check.put("keySecretLength", keySecret != null ? keySecret.length() : 0);
        check.put("isMockDetected", keyId == null || keySecret == null || 
                                   "mock_key_id".equalsIgnoreCase(keyId) || 
                                   "mock_key_secret".equalsIgnoreCase(keySecret) || 
                                   keyId.isBlank() || keySecret.isBlank());
        return check;
    }

    public List<Payment> getPaymentHistory() {
        if (SecurityUtils.isSuperAdmin()) {
            return paymentRepository.findAll();
        }
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        return paymentRepository.findByDealerId(dealerId);
    }

    public List<Invoice> getInvoiceHistory() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        return invoiceRepository.findByDealerId(dealerId);
    }

    @Transactional
    public Map<String, Object> createPaymentOrder(Long planId) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }

        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));

        Double amount = plan.getPrice();
        if (plan.getOfferDiscount() != null && plan.getOfferDiscount() > 0) {
            amount = Math.max(0.0, amount - plan.getOfferDiscount());
        }
        Double gst = amount * 0.18;
        Double total = amount + gst;

        String receiptId = "rcpt_" + System.currentTimeMillis();
        Map<String, Object> gatewayOrder = paymentGateway.createOrder(dealerId, total, receiptId);
        String orderId = (String) gatewayOrder.get("id");

        Payment payment = Payment.builder()
                .dealerId(dealerId)
                .subscriptionId(null)
                .orderId(orderId)
                .paymentId(null)
                .gateway("Razorpay")
                .amount(amount)
                .gst(gst)
                .totalAmount(total)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        return gatewayOrder;
    }

    @Transactional
    public Payment verifyPayment(String orderId, String paymentId, String signature, Long planId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            return payment;
        }

        boolean valid = paymentGateway.verifySignature(orderId, paymentId, signature);
        if (!valid) {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
            throw new IllegalArgumentException("Payment verification failed. Invalid signature.");
        }

        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));

        LocalDateTime start = LocalDateTime.now();
        Optional<DealerSubscription> currentSubOpt = subscriptionRepository.findFirstByDealerIdOrderByCreatedAtDesc(payment.getDealerId());
        if (currentSubOpt.isPresent()) {
            DealerSubscription currentSub = currentSubOpt.get();
            if ("ACTIVE".equalsIgnoreCase(currentSub.getStatus()) && currentSub.getEndDate().isAfter(LocalDateTime.now())) {
                start = currentSub.getEndDate();
            }
        }

        LocalDateTime end = start.plusMonths(plan.getDurationMonths());

        DealerSubscription subscription = DealerSubscription.builder()
                .dealerId(payment.getDealerId())
                .plan(plan)
                .startDate(start)
                .endDate(end)
                .graceEndDate(end.plusDays(7))
                .status("ACTIVE")
                .autoRenew(false)
                .build();
        DealerSubscription savedSub = subscriptionRepository.save(subscription);

        payment.setPaymentId(paymentId);
        payment.setSubscriptionId(savedSub.getId());
        payment.setStatus("SUCCESS");
        payment.setPaymentMethod("UPI");
        payment.setPaymentDate(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);

        String invoiceNum = "INV-" + LocalDateToNumString() + "-" + String.format("%04d", savedPayment.getId());
        Invoice invoice = Invoice.builder()
                .dealerId(payment.getDealerId())
                .invoiceNumber(invoiceNum)
                .paymentId(savedPayment.getId())
                .amount(payment.getAmount())
                .gst(payment.getGst())
                .pdfPath("/api/v1/payments/invoice/download/" + invoiceNum)
                .build();
        invoiceRepository.save(invoice);

        Dealer dealer = dealerRepository.findById(payment.getDealerId()).get();
        dealer.setStatus("ACTIVE");
        dealerRepository.save(dealer);

        return savedPayment;
    }

    @Transactional
    public void processWebhook(Map<String, Object> payload) {
        System.out.println("Processing webhook callback: " + payload);
    }

    @Transactional
    public Refund initiateRefund(Long paymentId, String reason) {
        if (!SecurityUtils.isSuperAdmin()) {
            throw new AccessDeniedException("Only Super Admin can issue refunds");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));

        if (!"SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalArgumentException("Only successful payments can be refunded");
        }

        Map<String, Object> gatewayRefund = paymentGateway.refund(payment.getPaymentId(), payment.getTotalAmount(), reason);
        String refundStatus = (String) gatewayRefund.get("status");

        Refund refund = Refund.builder()
                .paymentId(payment.getId())
                .refundAmount(payment.getTotalAmount())
                .reason(reason)
                .status("processed".equalsIgnoreCase(refundStatus) ? "PROCESSED" : "APPROVED")
                .build();
        Refund savedRefund = refundRepository.save(refund);

        payment.setStatus("REFUNDED");
        paymentRepository.save(payment);

        if (payment.getSubscriptionId() != null) {
            Optional<DealerSubscription> subOpt = subscriptionRepository.findById(payment.getSubscriptionId());
            if (subOpt.isPresent()) {
                DealerSubscription sub = subOpt.get();
                sub.setStatus("CANCELLED");
                subscriptionRepository.save(sub);
            }
        }

        return savedRefund;
    }

    public Invoice getInvoiceByPaymentId(Long paymentId) {
        return invoiceRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found for payment ID: " + paymentId));
    }

    private String LocalDateToNumString() {
        LocalDateTime now = LocalDateTime.now();
        return String.format("%d%02d%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
    }
}
