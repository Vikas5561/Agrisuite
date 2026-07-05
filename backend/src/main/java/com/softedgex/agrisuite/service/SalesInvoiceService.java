package com.softedgex.agrisuite.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.softedgex.agrisuite.dto.SalesInvoiceRequest;
import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.Farmer;
import com.softedgex.agrisuite.model.FarmerActivity;
import com.softedgex.agrisuite.model.Product;
import com.softedgex.agrisuite.model.SalesInvoice;
import com.softedgex.agrisuite.repository.FarmerActivityRepository;
import com.softedgex.agrisuite.repository.FarmerRepository;
import com.softedgex.agrisuite.repository.ProductRepository;
import com.softedgex.agrisuite.repository.SalesInvoiceRepository;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SalesInvoiceService {

    @Autowired
    private SalesInvoiceRepository salesInvoiceRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private FarmerActivityRepository activityRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private ObjectMapper objectMapper;

    public List<SalesInvoice> getSalesHistory() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        return salesInvoiceRepository.findByDealerIdOrderByCreatedAtDesc(dealerId);
    }

    @Transactional
    public SalesInvoice createSalesInvoice(SalesInvoiceRequest request) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        // Validate subscription
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. You cannot generate new bills. Please renew your subscription.");
        }

        // Validate farmer
        Farmer farmer = farmerRepository.findById(request.getFarmerId())
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found"));
        if (!farmer.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to farmer details");
        }

        double invoiceSubtotal = 0.0;
        double invoiceGst = 0.0;
        double invoiceTotal = 0.0;

        // Process items and stock
        for (SalesInvoiceRequest.SalesItem item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product " + item.getProductName() + " not found"));

            if (!product.getDealerId().equals(dealerId)) {
                throw new AccessDeniedException("Access denied to product catalog");
            }

            if (product.getStock() < item.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for " + product.getName() + 
                        ". Available: " + product.getStock() + " " + product.getUnit());
            }

            // Deduct stock
            product.setStock(product.getStock() - item.getQuantity());
            if (product.getStock() <= 0) {
                product.setStatus("OUT_OF_STOCK");
            }
            productRepository.save(product);

            // Re-calculate pricing to prevent tampering
            double baseAmount = product.getSellingPrice() * item.getQuantity();
            double gstAmount = baseAmount * (product.getGstPercentage() / 100.0);
            double totalAmount = baseAmount + gstAmount;

            invoiceSubtotal += baseAmount;
            invoiceGst += gstAmount;
            invoiceTotal += totalAmount;
        }

        // Determine cash paid vs outstanding book balance
        double paid = request.getAmountPaid() != null ? request.getAmountPaid() : 0.0;
        if ("CASH".equalsIgnoreCase(request.getPaymentMethod()) || "UPI".equalsIgnoreCase(request.getPaymentMethod())) {
            paid = invoiceTotal;
        } else if ("CREDIT".equalsIgnoreCase(request.getPaymentMethod())) {
            paid = 0.0;
        }

        double outstandingBalance = invoiceTotal - paid;
        if (outstandingBalance < 0.0) {
            outstandingBalance = 0.0;
        }

        if (outstandingBalance > 0.0) {
            double newCredit = (farmer.getOutstandingCredit() != null ? farmer.getOutstandingCredit() : 0.0) + outstandingBalance;
            farmer.setOutstandingCredit(newCredit);
            farmerRepository.save(farmer);
        }

        // Generate invoice number
        long count = salesInvoiceRepository.count();
        String invoiceNumber = String.format("SLS-%d-%06d", dealerId, count + 1);

        // Serialize itemsJson
        String itemsJson;
        try {
            itemsJson = objectMapper.writeValueAsString(request.getItems());
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize invoice items to JSON", e);
        }

        // Build and save invoice
        SalesInvoice invoice = SalesInvoice.builder()
                .dealerId(dealerId)
                .farmerId(farmer.getId())
                .farmerName(farmer.getFirstName() + " " + farmer.getLastName())
                .farmerMobile(farmer.getMobile())
                .invoiceNumber(invoiceNumber)
                .itemsJson(itemsJson)
                .subtotal(invoiceSubtotal)
                .gst(invoiceGst)
                .totalAmount(invoiceTotal)
                .paymentMethod(request.getPaymentMethod().toUpperCase())
                .amountPaid(paid)
                .outstandingBalance(outstandingBalance)
                .build();

        SalesInvoice savedInvoice = salesInvoiceRepository.save(invoice);

        // Add activity timeline
        String desc = String.format("Purchased products under Invoice %s for ₹%,.2f via %s", 
                invoiceNumber, invoiceTotal, request.getPaymentMethod());
        activityRepository.save(FarmerActivity.builder()
                .farmerId(farmer.getId())
                .activityType("Purchase")
                .description(desc)
                .build());

        return savedInvoice;
    }

    public List<SalesInvoice> getSalesByFarmer(Long farmerId) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found"));
        if (!farmer.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to farmer details");
        }
        return salesInvoiceRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
    }
}
