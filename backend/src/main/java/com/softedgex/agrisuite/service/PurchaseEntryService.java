package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.Product;
import com.softedgex.agrisuite.model.PurchaseEntry;
import com.softedgex.agrisuite.model.Supplier;
import com.softedgex.agrisuite.repository.ProductRepository;
import com.softedgex.agrisuite.repository.PurchaseEntryRepository;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class PurchaseEntryService {

    @Autowired
    private PurchaseEntryRepository purchaseEntryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SupplierService supplierService;

    @Autowired
    private SubscriptionService subscriptionService;

    public List<PurchaseEntry> getPurchaseEntries() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }
        return purchaseEntryRepository.findByDealerIdOrderByCreatedAtDesc(dealerId);
    }

    @Transactional
    public PurchaseEntry createPurchaseEntry(PurchaseEntry entry) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }

        // Validate subscription
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. You cannot record purchases. Please renew.");
        }

        // Validate supplier
        Supplier supplier = supplierService.getSupplierById(entry.getSupplierId());
        
        // Validate product
        Product product = productRepository.findById(entry.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        if (!product.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to product");
        }

        // Increment stock
        double originalStock = product.getStock() != null ? product.getStock() : 0.0;
        product.setStock(originalStock + entry.getQuantity());
        product.setStatus("ACTIVE"); // reset out of stock status
        productRepository.save(product);

        // Populate details
        entry.setDealerId(dealerId);
        entry.setSupplierName(supplier.getCompanyName());
        entry.setProductName(product.getName());
        
        double subtotal = entry.getQuantity() * entry.getPurchasePrice();
        double gst = subtotal * (entry.getGstPercentage() / 100.0);
        entry.setTotalAmount(subtotal + gst);

        return purchaseEntryRepository.save(entry);
    }

    public static class PurchaseBulkRequest {
        private String productName;
        private String supplierName;
        private Double quantity;
        private Double purchasePrice;
        private Double gstPercentage;
        private String billNumber;

        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public String getSupplierName() { return supplierName; }
        public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
        public Double getQuantity() { return quantity; }
        public void setQuantity(Double quantity) { this.quantity = quantity; }
        public Double getPurchasePrice() { return purchasePrice; }
        public void setPurchasePrice(Double purchasePrice) { this.purchasePrice = purchasePrice; }
        public Double getGstPercentage() { return gstPercentage; }
        public void setGstPercentage(Double gstPercentage) { this.gstPercentage = gstPercentage; }
        public String getBillNumber() { return billNumber; }
        public void setBillNumber(String billNumber) { this.billNumber = billNumber; }
    }

    @Transactional
    public List<PurchaseEntry> createPurchasesBulk(List<PurchaseBulkRequest> requests) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. You cannot add purchases.");
        }

        List<PurchaseEntry> saved = new java.util.ArrayList<>();
        for (PurchaseBulkRequest req : requests) {
            if (req.getProductName() == null || req.getProductName().isBlank() || req.getSupplierName() == null || req.getSupplierName().isBlank()) {
                continue;
            }
            // Find or create Supplier by Company Name
            Supplier supplier = supplierService.getSuppliers().stream()
                    .filter(sup -> sup.getCompanyName().equalsIgnoreCase(req.getSupplierName()))
                    .findFirst()
                    .orElseGet(() -> {
                        Supplier newSup = new Supplier();
                        newSup.setCompanyName(req.getSupplierName());
                        newSup.setContactName("Bulk Imported");
                        newSup.setMobile("0000000000");
                        newSup.setAddress("N/A");
                        return supplierService.createSupplier(newSup);
                    });

            // Find Product by Name
            Product product = productRepository.findByDealerId(dealerId).stream()
                    .filter(prod -> prod.getName().equalsIgnoreCase(req.getProductName()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Product not found by name: " + req.getProductName() + ". Please register the product in inventory first."));

            PurchaseEntry entry = new PurchaseEntry();
            entry.setDealerId(dealerId);
            entry.setSupplierId(supplier.getId());
            entry.setSupplierName(supplier.getCompanyName());
            entry.setProductId(product.getId());
            entry.setProductName(product.getName());
            entry.setQuantity(req.getQuantity());
            entry.setPurchasePrice(req.getPurchasePrice());
            entry.setGstPercentage(req.getGstPercentage());
            entry.setBillNumber(req.getBillNumber());

            // Increment stock
            double originalStock = product.getStock() != null ? product.getStock() : 0.0;
            product.setStock(originalStock + req.getQuantity());
            product.setStatus("ACTIVE");
            productRepository.save(product);

            double subtotal = entry.getQuantity() * entry.getPurchasePrice();
            double gst = subtotal * (entry.getGstPercentage() / 100.0);
            entry.setTotalAmount(subtotal + gst);

            saved.add(purchaseEntryRepository.save(entry));
        }
        return saved;
    }
}
