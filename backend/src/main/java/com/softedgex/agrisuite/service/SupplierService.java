package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.Supplier;
import com.softedgex.agrisuite.repository.SupplierRepository;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    public List<Supplier> getSuppliers() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }
        return supplierRepository.findByDealerId(dealerId);
    }

    public Supplier getSupplierById(Long id) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
        if (!supplier.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied");
        }
        return supplier;
    }

    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }

        // Validate subscription
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. You cannot add suppliers. Please renew.");
        }

        // Duplicate code detection
        if (supplier.getSupplierCode() != null && !supplier.getSupplierCode().isBlank()) {
            if (supplierRepository.findBySupplierCode(supplier.getSupplierCode()).isPresent()) {
                throw new IllegalArgumentException("Supplier code " + supplier.getSupplierCode() + " already registered");
            }
        } else {
            long count = supplierRepository.count();
            supplier.setSupplierCode(String.format("SPL%06d", count + 1));
        }

        supplier.setDealerId(dealerId);
        supplier.setStatus("ACTIVE");
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier updateSupplier(Long id, Supplier updateDto) {
        Supplier existing = getSupplierById(id);

        existing.setCompanyName(updateDto.getCompanyName());
        existing.setCategory(updateDto.getCategory());
        existing.setGstNumber(updateDto.getGstNumber());
        existing.setPanNumber(updateDto.getPanNumber());
        existing.setContactName(updateDto.getContactName());
        existing.setMobile(updateDto.getMobile());
        existing.setEmail(updateDto.getEmail());
        existing.setAddress(updateDto.getAddress());
        existing.setCity(updateDto.getCity());
        existing.setDistrict(updateDto.getDistrict());
        existing.setState(updateDto.getState());
        existing.setPinCode(updateDto.getPinCode());
        existing.setCreditDays(updateDto.getCreditDays());
        existing.setCreditLimit(updateDto.getCreditLimit());
        if (updateDto.getStatus() != null) {
            existing.setStatus(updateDto.getStatus());
        }

        return supplierRepository.save(existing);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = getSupplierById(id);
        supplierRepository.delete(supplier);
    }

    @Transactional
    public List<Supplier> createSuppliersBulk(List<Supplier> suppliers) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. You cannot add suppliers.");
        }

        List<Supplier> saved = new java.util.ArrayList<>();
        for (Supplier s : suppliers) {
            if (s.getCompanyName() == null || s.getCompanyName().isBlank()) {
                continue;
            }
            // Skip duplicates by Company Name under same dealer
            if (supplierRepository.findByDealerId(dealerId).stream()
                    .anyMatch(sup -> sup.getCompanyName().equalsIgnoreCase(s.getCompanyName()))) {
                continue;
            }
            long count = supplierRepository.count() + saved.size();
            s.setSupplierCode(String.format("SPL%06d", count + 1));
            s.setDealerId(dealerId);
            s.setStatus("ACTIVE");
            saved.add(supplierRepository.save(s));
        }
        return saved;
    }
}
