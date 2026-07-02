package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.Product;
import com.softedgex.agrisuite.repository.ProductRepository;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    public List<Product> getProducts() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        return productRepository.findByDealerId(dealerId);
    }

    public List<Product> getLowStockProducts() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        return productRepository.findLowStockProducts(dealerId);
    }

    public List<Product> searchProducts(String query) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        return productRepository.searchProducts(dealerId, query);
    }

    public Product getProductById(Long id) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (!product.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to product");
        }
        return product;
    }

    @Transactional
    public Product createProduct(Product product) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        // Validate subscription
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. You cannot add new products. Please renew your subscription.");
        }

        if (product.getProductCode() != null && !product.getProductCode().isBlank()) {
            if (productRepository.findByProductCode(product.getProductCode()).isPresent()) {
                throw new IllegalArgumentException("Product with code " + product.getProductCode() + " already exists");
            }
        } else {
            long count = productRepository.count();
            String code;
            do {
                count++;
                code = String.format("PRD%06d", count);
            } while (productRepository.findByProductCode(code).isPresent());
            product.setProductCode(code);
        }

        product.setDealerId(dealerId);
        if (product.getStock() <= 0) {
            product.setStatus("OUT_OF_STOCK");
        } else {
            product.setStatus("ACTIVE");
        }

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, Product updateDto) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (!existing.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied");
        }

        existing.setName(updateDto.getName());
        existing.setBrand(updateDto.getBrand());
        existing.setCategory(updateDto.getCategory());
        existing.setProductType(updateDto.getProductType());
        existing.setUnit(updateDto.getUnit());
        existing.setStock(updateDto.getStock());
        existing.setMinimumStock(updateDto.getMinimumStock());
        existing.setMaximumStock(updateDto.getMaximumStock());
        existing.setReorderLevel(updateDto.getReorderLevel());
        existing.setPurchasePrice(updateDto.getPurchasePrice());
        existing.setSellingPrice(updateDto.getSellingPrice());
        existing.setMrp(updateDto.getMrp());
        existing.setGstPercentage(updateDto.getGstPercentage());
        if (updateDto.getDiscountAllowed() != null) {
            existing.setDiscountAllowed(updateDto.getDiscountAllowed());
        }
        
        if (updateDto.getStatus() != null) {
            existing.setStatus(updateDto.getStatus());
        }
        if (existing.getStock() != null && existing.getStock() <= 0) {
            existing.setStatus("OUT_OF_STOCK");
        }
        if (existing.getStatus() == null) {
            existing.setStatus("ACTIVE");
        }

        return productRepository.save(existing);
    }

    @Transactional
    public void adjustStock(Long id, Double qty) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (!product.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied");
        }

        double newStock = product.getStock() + qty;
        if (newStock < 0) {
            throw new IllegalArgumentException("Cannot reduce stock below zero. Current stock: " + product.getStock());
        }

        product.setStock(newStock);
        if (newStock <= 0) {
            product.setStatus("OUT_OF_STOCK");
        } else {
            product.setStatus("ACTIVE");
        }
        productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (dealerId != null && !product.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to delete this product");
        }
        productRepository.delete(product);
    }
}
