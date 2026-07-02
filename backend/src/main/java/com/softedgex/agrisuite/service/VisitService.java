package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.Farmer;
import com.softedgex.agrisuite.model.FarmerActivity;
import com.softedgex.agrisuite.model.Staff;
import com.softedgex.agrisuite.model.Visit;
import com.softedgex.agrisuite.repository.FarmerActivityRepository;
import com.softedgex.agrisuite.repository.FarmerRepository;
import com.softedgex.agrisuite.repository.StaffRepository;
import com.softedgex.agrisuite.repository.VisitRepository;
import com.softedgex.agrisuite.security.UserContext;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class VisitService {

    @Autowired
    private VisitRepository visitRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private FarmerActivityRepository activityRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    public List<Visit> getVisits() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        UserContext.UserSessionInfo sessionInfo = UserContext.get();
        if (sessionInfo != null && "STAFF".equalsIgnoreCase(sessionInfo.getRole())) {
            Optional<Staff> staffOpt = staffRepository.findByUserId(sessionInfo.getUserId());
            if (staffOpt.isPresent()) {
                return visitRepository.findByStaffIdOrderByVisitDateDesc(staffOpt.get().getId());
            }
        }
        return visitRepository.findByDealerIdOrderByVisitDateDesc(dealerId);
    }

    public Visit getVisitById(Long id) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visit not found"));
        if (!visit.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to field visit");
        }
        return visit;
    }

    @Transactional
    public Visit createVisit(Visit visit) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        // Validate subscription
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. You cannot schedule field visits. Please renew.");
        }

        // Validate farmer
        Farmer farmer = farmerRepository.findById(visit.getFarmerId())
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found"));
        if (!farmer.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to farmer");
        }

        // Determine staff
        UserContext.UserSessionInfo sessionInfo = UserContext.get();
        boolean isOwner = sessionInfo == null || !"STAFF".equalsIgnoreCase(sessionInfo.getRole());
        
        Long assignedStaffId = null;
        String assignedStaffName = "";
        
        if (sessionInfo != null && "STAFF".equalsIgnoreCase(sessionInfo.getRole())) {
            Staff staff = staffRepository.findByUserId(sessionInfo.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Staff profile not found for current login"));
            assignedStaffId = staff.getId();
            assignedStaffName = staff.getFirstName() + " " + staff.getLastName();
            isOwner = false;
        } else {
            // Dealer admin is scheduling/logging
            if (visit.getStaffId() != null) {
                if (visit.getStaffId() == -1L) {
                    assignedStaffId = -1L;
                    assignedStaffName = "Owner (Dealer Admin)";
                    isOwner = true;
                } else {
                    Staff staff = staffRepository.findById(visit.getStaffId())
                            .orElseThrow(() -> new IllegalArgumentException("Staff member not found"));
                    if (!staff.getDealerId().equals(dealerId)) {
                        throw new AccessDeniedException("Access denied to selected staff member");
                    }
                    assignedStaffId = staff.getId();
                    assignedStaffName = staff.getFirstName() + " " + staff.getLastName();
                    isOwner = false;
                }
            } else {
                throw new IllegalArgumentException("Staff member must be assigned to field visit");
            }
        }

        visit.setDealerId(dealerId);
        visit.setFarmerName(farmer.getFirstName() + " " + farmer.getLastName());
        visit.setStaffId(assignedStaffId);
        visit.setStaffName(assignedStaffName);

        String currentStatus = visit.getStatus();
        if (currentStatus == null) {
            currentStatus = "COMPLETED";
        }

        if ("COMPLETED".equalsIgnoreCase(currentStatus)) {
            if (isOwner) {
                visit.setStatus("COMPLETED");
            } else {
                visit.setStatus("PENDING_VERIFICATION");
            }
        } else {
            visit.setStatus(currentStatus.toUpperCase());
        }

        Visit savedVisit = visitRepository.save(visit);

        // Record farmer timeline activity
        String desc = String.format("Field visit (%s) logged by %s. Status: %s. Observations: %s", 
                visit.getVisitType(), visit.getStaffName(), visit.getStatus(),
                visit.getObservations() != null ? visit.getObservations() : "None");
        
        activityRepository.save(FarmerActivity.builder()
                .farmerId(farmer.getId())
                .activityType("Visit")
                .description(desc)
                .build());

        return savedVisit;
    }

    @Transactional
    public Visit updateVisit(Long id, Visit updateDto) {
        Visit existing = getVisitById(id);

        if (!"SCHEDULED".equalsIgnoreCase(existing.getStatus())) {
            throw new IllegalArgumentException("Only scheduled field visits can be edited.");
        }

        UserContext.UserSessionInfo sessionInfo = UserContext.get();
        boolean isOwner = sessionInfo == null || !"STAFF".equalsIgnoreCase(sessionInfo.getRole());

        existing.setVisitType(updateDto.getVisitType());
        existing.setVisitDate(updateDto.getVisitDate());
        existing.setObservations(updateDto.getObservations());
        existing.setRecommendations(updateDto.getRecommendations());

        String targetStatus = updateDto.getStatus() != null ? updateDto.getStatus() : "COMPLETED";
        if ("COMPLETED".equalsIgnoreCase(targetStatus)) {
            if (isOwner) {
                existing.setStatus("COMPLETED");
            } else {
                existing.setStatus("PENDING_VERIFICATION");
            }
        } else {
            existing.setStatus(targetStatus.toUpperCase());
        }

        return visitRepository.save(existing);
    }

    @Transactional
    public Visit verifyVisit(Long id) {
        Visit visit = getVisitById(id);
        if (!"PENDING_VERIFICATION".equalsIgnoreCase(visit.getStatus())) {
            throw new IllegalArgumentException("Only visits pending verification can be verified.");
        }
        visit.setStatus("COMPLETED");
        Visit saved = visitRepository.save(visit);

        // Track timeline activity
        String desc = String.format("Field visit (%s) conducted by %s verified by Owner.", 
                visit.getVisitType(), visit.getStaffName());
        activityRepository.save(FarmerActivity.builder()
                .farmerId(visit.getFarmerId())
                .activityType("Visit Verified")
                .description(desc)
                .build());

        return saved;
    }

    @Transactional
    public void deleteVisit(Long id) {
        Visit visit = getVisitById(id);
        visitRepository.delete(visit);
    }
}
