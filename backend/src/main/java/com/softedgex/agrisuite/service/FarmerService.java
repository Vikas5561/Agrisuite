package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.Farmer;
import com.softedgex.agrisuite.model.FarmerActivity;
import com.softedgex.agrisuite.model.FarmerNote;
import com.softedgex.agrisuite.model.Product;
import com.softedgex.agrisuite.repository.FarmerActivityRepository;
import com.softedgex.agrisuite.repository.FarmerNoteRepository;
import com.softedgex.agrisuite.repository.FarmerRepository;
import com.softedgex.agrisuite.repository.ProductRepository;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.softedgex.agrisuite.dto.SalesInvoiceRequest;
import org.springframework.context.annotation.Lazy;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FarmerService {

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private FarmerActivityRepository activityRepository;

    @Autowired
    private FarmerNoteRepository noteRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    @Lazy
    private SalesInvoiceService salesInvoiceService;

    public List<Farmer> getFarmers() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }
        return farmerRepository.findByDealerId(dealerId);
    }

    public List<Farmer> searchFarmers(String query) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }
        return farmerRepository.searchFarmers(dealerId, query);
    }

    public Farmer getFarmerById(Long id) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Farmer farmer = farmerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found"));

        if (!farmer.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to farmer details");
        }
        return farmer;
    }

    @Transactional
    public Farmer createFarmer(Farmer farmer) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }

        // Enforce subscription validation
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. You cannot add new farmers. Please renew your subscription.");
        }

        // Duplicate detection
        if (farmerRepository.findByMobileAndDealerId(farmer.getMobile(), dealerId).isPresent()) {
            throw new IllegalArgumentException("Farmer with mobile number " + farmer.getMobile() + " is already registered under this dealer.");
        }

        // Generate farmer code
        long count = farmerRepository.count();
        String farmerCode = String.format("FRM%06d", count + 1);
        farmer.setFarmerCode(farmerCode);
        farmer.setDealerId(dealerId);
        farmer.setStatus("ACTIVE");

        Farmer savedFarmer = farmerRepository.save(farmer);

        // Add to timeline activity
        FarmerActivity activity = FarmerActivity.builder()
                .farmerId(savedFarmer.getId())
                .activityType("Registration")
                .description("Farmer profile created with code " + farmerCode)
                .build();
        activityRepository.save(activity);

        return savedFarmer;
    }

    @Transactional
    public Farmer updateFarmer(Long id, Farmer updateDto) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Farmer existing = farmerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found"));

        if (!existing.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied");
        }

        existing.setFirstName(updateDto.getFirstName());
        existing.setLastName(updateDto.getLastName());
        existing.setMobile(updateDto.getMobile());
        existing.setAlternateMobile(updateDto.getAlternateMobile());
        existing.setVillage(updateDto.getVillage());
        existing.setTaluka(updateDto.getTaluka());
        existing.setDistrict(updateDto.getDistrict());
        existing.setState(updateDto.getState());
        existing.setPinCode(updateDto.getPinCode());
        existing.setFarmSize(updateDto.getFarmSize());
        existing.setFarmUnit(updateDto.getFarmUnit());
        existing.setSoilType(updateDto.getSoilType());
        existing.setIrrigationType(updateDto.getIrrigationType());
        existing.setPrimaryCrop(updateDto.getPrimaryCrop());
        existing.setSecondaryCrop(updateDto.getSecondaryCrop());
        existing.setCreditLimit(updateDto.getCreditLimit());
        if (updateDto.getOutstandingCredit() != null) {
            existing.setOutstandingCredit(updateDto.getOutstandingCredit());
        }
        if (updateDto.getStatus() != null) {
            existing.setStatus(updateDto.getStatus());
        }

        return farmerRepository.save(existing);
    }

    @Transactional
    public void setFarmerStatus(Long id, String status) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Farmer farmer = farmerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found"));

        if (!farmer.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied");
        }

        farmer.setStatus(status);
        farmerRepository.save(farmer);

        // Track timeline activity
        activityRepository.save(FarmerActivity.builder()
                .farmerId(id)
                .activityType("Status Changed")
                .description("Farmer status changed to " + status)
                .build());
    }

    public List<FarmerActivity> getTimeline(Long farmerId) {
        getFarmerById(farmerId);
        return activityRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
    }

    public List<FarmerNote> getNotes(Long farmerId) {
        getFarmerById(farmerId);
        return noteRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
    }

    @Transactional
    public FarmerNote addNote(Long farmerId, String noteText) {
        getFarmerById(farmerId);
        String username = SecurityUtils.getCurrentUsername();

        FarmerNote note = FarmerNote.builder()
                .farmerId(farmerId)
                .note(noteText)
                .createdBy(username != null ? username : "System")
                .build();
        return noteRepository.save(note);
    }

    @Transactional
    public Farmer sellProduct(Long farmerId, Long productId, Double quantity, String paymentMethod) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Farmer farmer = getFarmerById(farmerId);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (!product.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to product");
        }

        // Build SalesInvoiceRequest
        SalesInvoiceRequest request = new SalesInvoiceRequest();
        request.setFarmerId(farmerId);
        request.setPaymentMethod(paymentMethod);

        double baseAmount = product.getSellingPrice() * quantity;
        double gstAmount = baseAmount * (product.getGstPercentage() / 100.0);
        double totalAmount = baseAmount + gstAmount;

        request.setAmountPaid("CREDIT".equalsIgnoreCase(paymentMethod) ? 0.0 : totalAmount);

        SalesInvoiceRequest.SalesItem item = new SalesInvoiceRequest.SalesItem();
        item.setProductId(productId);
        item.setProductName(product.getName());
        item.setBrand(product.getBrand());
        item.setQuantity(quantity);
        item.setUnit(product.getUnit());
        item.setSellingPrice(product.getSellingPrice());
        item.setGstPercentage(product.getGstPercentage());
        item.setSubtotal(baseAmount);
        item.setGstAmount(gstAmount);
        item.setTotal(totalAmount);

        request.setItems(java.util.List.of(item));

        // Route through standard billing service
        salesInvoiceService.createSalesInvoice(request);

        return farmerRepository.findById(farmerId).orElse(farmer);
    }

    @Transactional
    public void deleteFarmer(Long id) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Farmer farmer = farmerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found"));

        if (dealerId != null && !farmer.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to delete this farmer profile");
        }

        // Clean up notes and activities
        List<FarmerActivity> activities = activityRepository.findByFarmerIdOrderByCreatedAtDesc(id);
        activityRepository.deleteAll(activities);

        List<FarmerNote> notes = noteRepository.findByFarmerIdOrderByCreatedAtDesc(id);
        noteRepository.deleteAll(notes);

        farmerRepository.delete(farmer);
    }
}
