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
}
