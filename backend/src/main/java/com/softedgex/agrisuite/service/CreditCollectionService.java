package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.CreditCollection;
import com.softedgex.agrisuite.model.Farmer;
import com.softedgex.agrisuite.model.FarmerActivity;
import com.softedgex.agrisuite.repository.CreditCollectionRepository;
import com.softedgex.agrisuite.repository.FarmerActivityRepository;
import com.softedgex.agrisuite.repository.FarmerRepository;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CreditCollectionService {

    @Autowired
    private CreditCollectionRepository creditCollectionRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private FarmerActivityRepository activityRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    public List<CreditCollection> getCollections() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }
        return creditCollectionRepository.findByDealerIdOrderByCollectedAtDesc(dealerId);
    }

    @Transactional
    public CreditCollection collectCredit(CreditCollection collection) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context");
        }

        // Validate subscription
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. You cannot record collections. Please renew.");
        }

        // Validate farmer
        Farmer farmer = farmerRepository.findById(collection.getFarmerId())
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found"));
        if (!farmer.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to farmer");
        }

        if (collection.getAmount() <= 0) {
            throw new IllegalArgumentException("Collection amount must be greater than zero");
        }

        double outstanding = farmer.getOutstandingCredit() != null ? farmer.getOutstandingCredit() : 0.0;
        if (outstanding < collection.getAmount()) {
            throw new IllegalArgumentException("Collection amount cannot exceed outstanding credit of ₹" + outstanding);
        }

        // Decrement outstanding balance
        farmer.setOutstandingCredit(outstanding - collection.getAmount());
        farmerRepository.save(farmer);

        // Populate collection
        collection.setDealerId(dealerId);
        collection.setFarmerName(farmer.getFirstName() + " " + farmer.getLastName());
        
        String username = SecurityUtils.getCurrentUsername();
        collection.setCollectedBy(username != null ? username : "System");

        CreditCollection savedCollection = creditCollectionRepository.save(collection);

        // Record farmer timeline activity
        String desc = String.format("Paid ₹%,.2f outstanding credit balance via %s. Reference: %s", 
                collection.getAmount(), collection.getPaymentMode(), 
                collection.getReferenceNumber() != null && !collection.getReferenceNumber().isBlank() ? collection.getReferenceNumber() : "N/A");
        
        activityRepository.save(FarmerActivity.builder()
                .farmerId(farmer.getId())
                .activityType("Payment")
                .description(desc)
                .build());

        return savedCollection;
    }
}
