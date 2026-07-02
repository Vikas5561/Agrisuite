package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.*;
import com.softedgex.agrisuite.repository.*;
import com.softedgex.agrisuite.util.PasswordUtils;
import com.softedgex.agrisuite.util.SecurityUtils;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SubscriptionService {

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private DealerSubscriptionRepository subscriptionRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordUtils passwordUtils;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    private String getInvoiceDateStr(LocalDateTime time) {
        if (time == null) time = LocalDateTime.now();
        return String.format("%d%02d%02d", time.getYear(), time.getMonthValue(), time.getDayOfMonth());
    }

    @PostConstruct
    public void initPlansAndSuperAdmin() {
        if (planRepository.count() == 0) {
            planRepository.save(SubscriptionPlan.builder().name("Starter").durationMonths(1).price(2000.0).maxStaff(2).maxStorage(1000).maxDocuments(100).status("ACTIVE").build());
            planRepository.save(SubscriptionPlan.builder().name("Standard").durationMonths(3).price(5500.0).maxStaff(5).maxStorage(5000).maxDocuments(500).status("ACTIVE").build());
            planRepository.save(SubscriptionPlan.builder().name("Professional").durationMonths(6).price(11000.0).maxStaff(10).maxStorage(15000).maxDocuments(1000).status("ACTIVE").build());
            planRepository.save(SubscriptionPlan.builder().name("Enterprise").durationMonths(12).price(20000.0).maxStaff(100).maxStorage(100000).maxDocuments(10000).status("ACTIVE").build());
        }

        if (roleRepository.count() == 0) {
            Role saRole = Role.builder().roleName("SUPER_ADMIN").description("Platform Software Owner").build();
            Role daRole = Role.builder().roleName("DEALER_ADMIN").description("Fertilizer Dealer Owner").build();
            Role stRole = Role.builder().roleName("STAFF").description("Dealer Staff Employee").build();
            roleRepository.save(saRole);
            roleRepository.save(daRole);
            roleRepository.save(stRole);
        }

        if (userRepository.findByUsername("superadmin").isEmpty()) {
            Role saRole = roleRepository.findByRoleName("SUPER_ADMIN").get();
            User superAdmin = User.builder()
                    .role(saRole)
                    .username("superadmin")
                    .email("support@softedgex.com")
                    .mobile("9999999999")
                    .password(passwordUtils.encode("Password@123"))
                    .status("ACTIVE")
                    .build();
            userRepository.save(superAdmin);
        }

        // Self-healing migration for subscriptions without payment records
        try {
            List<DealerSubscription> subs = subscriptionRepository.findAll();
            for (DealerSubscription sub : subs) {
                boolean hasPayment = paymentRepository.findAll().stream()
                        .anyMatch(p -> sub.getId().equals(p.getSubscriptionId()));
                if (!hasPayment) {
                    SubscriptionPlan plan = sub.getPlan();
                    Double amount = plan.getPrice();
                    Double gst = amount * 0.18;
                    Double total = amount + gst;

                    Payment payment = Payment.builder()
                            .dealerId(sub.getDealerId())
                            .subscriptionId(sub.getId())
                            .orderId("order_init_" + sub.getId() + "_" + System.currentTimeMillis())
                            .paymentId("pay_init_" + sub.getId() + "_" + System.currentTimeMillis())
                            .gateway("Manual_Migration")
                            .amount(amount)
                            .gst(gst)
                            .totalAmount(total)
                            .status("SUCCESS")
                            .paymentMethod("UPI")
                            .paymentDate(sub.getStartDate())
                            .createdAt(sub.getStartDate())
                            .build();
                    Payment savedPayment = paymentRepository.save(payment);

                    String invoiceNum = "INV-" + getInvoiceDateStr(sub.getStartDate()) + "-" + String.format("%04d", savedPayment.getId());
                    Invoice invoice = Invoice.builder()
                            .dealerId(sub.getDealerId())
                            .invoiceNumber(invoiceNum)
                            .paymentId(savedPayment.getId())
                            .amount(payment.getAmount())
                            .gst(payment.getGst())
                            .pdfPath("/api/v1/payments/invoice/download/" + invoiceNum)
                            .build();
                    invoiceRepository.save(invoice);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to run self-healing subscription payments: " + e.getMessage());
        }
    }

    public List<SubscriptionPlan> getPlans() {
        return planRepository.findAll();
    }

    public DealerSubscription getCurrentSubscription(Long dealerId) {
        if (!SecurityUtils.isSuperAdmin() && !dealerId.equals(SecurityUtils.getCurrentDealerId())) {
            throw new AccessDeniedException("Access denied to subscription info");
        }
        return subscriptionRepository.findFirstByDealerIdOrderByCreatedAtDesc(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found for dealer ID: " + dealerId));
    }

    @Transactional
    public DealerSubscription renewSubscription(Long dealerId, Long planId) {
        if (!SecurityUtils.isSuperAdmin() && !dealerId.equals(SecurityUtils.getCurrentDealerId())) {
            throw new AccessDeniedException("Access denied");
        }

        DealerSubscription current = subscriptionRepository.findFirstByDealerIdOrderByCreatedAtDesc(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("No current subscription found to renew"));

        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Selected subscription plan not found"));

        LocalDateTime start = LocalDateTime.now();
        if ("ACTIVE".equalsIgnoreCase(current.getStatus()) && current.getEndDate().isAfter(LocalDateTime.now())) {
            start = current.getEndDate();
        }

        LocalDateTime end = start.plusMonths(plan.getDurationMonths());

        DealerSubscription renewed = DealerSubscription.builder()
                .dealerId(dealerId)
                .plan(plan)
                .startDate(start)
                .endDate(end)
                .graceEndDate(end.plusDays(7))
                .status("ACTIVE")
                .autoRenew(current.getAutoRenew())
                .build();

        Dealer dealer = dealerRepository.findById(dealerId).get();
        dealer.setStatus("ACTIVE");
        dealerRepository.save(dealer);

        return subscriptionRepository.save(renewed);
    }

    @Transactional
    public DealerSubscription upgradeSubscription(Long dealerId, Long planId) {
        if (!SecurityUtils.isSuperAdmin() && !dealerId.equals(SecurityUtils.getCurrentDealerId())) {
            throw new AccessDeniedException("Access denied");
        }

        DealerSubscription current = subscriptionRepository.findFirstByDealerIdOrderByCreatedAtDesc(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found"));

        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));

        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = start.plusMonths(plan.getDurationMonths());

        current.setStatus("CANCELLED");
        subscriptionRepository.save(current);

        DealerSubscription upgraded = DealerSubscription.builder()
                .dealerId(dealerId)
                .plan(plan)
                .startDate(start)
                .endDate(end)
                .graceEndDate(end.plusDays(7))
                .status("ACTIVE")
                .autoRenew(current.getAutoRenew())
                .build();

        Dealer dealer = dealerRepository.findById(dealerId).get();
        dealer.setStatus("ACTIVE");
        dealerRepository.save(dealer);

        return subscriptionRepository.save(upgraded);
    }

    @Transactional
    public DealerSubscription cancelSubscription(Long dealerId) {
        if (!SecurityUtils.isSuperAdmin() && !dealerId.equals(SecurityUtils.getCurrentDealerId())) {
            throw new AccessDeniedException("Access denied");
        }

        DealerSubscription current = subscriptionRepository.findFirstByDealerIdOrderByCreatedAtDesc(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found"));

        current.setStatus("CANCELLED");
        current.setAutoRenew(false);
        
        Dealer dealer = dealerRepository.findById(dealerId).get();
        dealer.setStatus("INACTIVE");
        dealerRepository.save(dealer);

        return subscriptionRepository.save(current);
    }

    @Transactional
    public DealerSubscription extendSubscription(Long dealerId, int months) {
        if (!SecurityUtils.isSuperAdmin()) {
            throw new AccessDeniedException("Only Super Admin can extend subscriptions manually");
        }

        DealerSubscription current = subscriptionRepository.findFirstByDealerIdOrderByCreatedAtDesc(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found"));

        current.setEndDate(current.getEndDate().plusMonths(months));
        current.setGraceEndDate(current.getGraceEndDate().plusMonths(months));
        current.setStatus("ACTIVE");
        
        Dealer dealer = dealerRepository.findById(dealerId).get();
        dealer.setStatus("ACTIVE");
        dealerRepository.save(dealer);

        return subscriptionRepository.save(current);
    }

    public boolean checkFeatureAccess(Long dealerId) {
        Optional<DealerSubscription> subOpt = subscriptionRepository.findFirstByDealerIdOrderByCreatedAtDesc(dealerId);
        if (subOpt.isEmpty()) {
            return false;
        }
        DealerSubscription sub = subOpt.get();
        if ("ACTIVE".equalsIgnoreCase(sub.getStatus())) {
            if (LocalDateTime.now().isAfter(sub.getEndDate())) {
                if (LocalDateTime.now().isAfter(sub.getGraceEndDate())) {
                    sub.setStatus("EXPIRED");
                    subscriptionRepository.save(sub);
                    return false;
                }
                return false;
            }
            return true;
        }
        return false;
    }

    @Transactional
    public SubscriptionPlan updatePlan(Long id, SubscriptionPlan updateDto) {
        if (!SecurityUtils.isSuperAdmin()) {
            throw new AccessDeniedException("Only Super Admin can edit subscription plans");
        }
        SubscriptionPlan existing = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found with ID: " + id));

        existing.setName(updateDto.getName());
        existing.setDurationMonths(updateDto.getDurationMonths());
        existing.setPrice(updateDto.getPrice());
        existing.setMaxStaff(updateDto.getMaxStaff());
        existing.setMaxStorage(updateDto.getMaxStorage());
        existing.setMaxDocuments(updateDto.getMaxDocuments());
        existing.setStatus(updateDto.getStatus());
        existing.setOfferDiscount(updateDto.getOfferDiscount());
        existing.setOfferCode(updateDto.getOfferCode());
        existing.setOfferDescription(updateDto.getOfferDescription());

        return planRepository.save(existing);
    }

    @Transactional
    public SubscriptionPlan createPlan(SubscriptionPlan plan) {
        if (!SecurityUtils.isSuperAdmin()) {
            throw new AccessDeniedException("Only Super Admin can create subscription plans");
        }
        if (plan.getStatus() == null) {
            plan.setStatus("ACTIVE");
        }
        return planRepository.save(plan);
    }
}
