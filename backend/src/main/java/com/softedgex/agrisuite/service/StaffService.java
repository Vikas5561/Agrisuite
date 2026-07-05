package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.*;
import com.softedgex.agrisuite.repository.*;
import com.softedgex.agrisuite.util.PasswordUtils;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class StaffService {

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DealerSubscriptionRepository subscriptionRepository;

    @Autowired
    private PasswordUtils passwordUtils;

    public List<Staff> getStaffByDealer() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        return staffRepository.findByDealerId(dealerId);
    }

    public Staff getStaffById(Long id) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found"));

        if (!staff.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to staff profile");
        }
        return staff;
    }

    @Transactional
    public Staff createStaff(Staff staff) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        // Validate duplicates
        if (staffRepository.findByEmailAndDealerId(staff.getEmail(), dealerId).isPresent()) {
            throw new IllegalArgumentException("Email already exists for this dealer");
        }
        if (staffRepository.findByMobileAndDealerId(staff.getMobile(), dealerId).isPresent()) {
            throw new IllegalArgumentException("Mobile number already exists for this dealer");
        }

        // Verify Staff limits
        DealerSubscription subscription = subscriptionRepository.findFirstByDealerIdOrderByCreatedAtDesc(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("No active subscription plan found. Please purchase a plan first."));

        if (!"ACTIVE".equalsIgnoreCase(subscription.getStatus())) {
            throw new IllegalArgumentException("Subscription is not active. Please renew your plan.");
        }

        long currentStaffCount = staffRepository.countByDealerId(dealerId);
        if (currentStaffCount >= subscription.getPlan().getMaxStaff()) {
            throw new IllegalArgumentException("Staff limit of " + subscription.getPlan().getMaxStaff() + " has been reached for your active plan (" + subscription.getPlan().getName() + "). Please upgrade your plan.");
        }

        // Generate employee code
        long count = staffRepository.count();
        String employeeCode = String.format("EMP%06d", count + 1);
        staff.setEmployeeCode(employeeCode);
        staff.setDealerId(dealerId);
        staff.setStatus("ACTIVE");

        // Create User login account
        Role staffRole = roleRepository.findByRoleName("STAFF")
                .orElseGet(() -> {
                    Role role = Role.builder().roleName("STAFF").description("Dealer Staff role").build();
                    return roleRepository.save(role);
                });

        User user = User.builder()
                .dealerId(dealerId)
                .role(staffRole)
                .username(employeeCode.toLowerCase())
                .email(staff.getEmail())
                .mobile(staff.getMobile())
                .password(passwordUtils.encode("Staff@123")) // Default temporary password
                .status("ACTIVE")
                .build();
        User savedUser = userRepository.save(user);

        staff.setUserId(savedUser.getId());
        return staffRepository.save(staff);
    }

    @Transactional
    public Staff updateStaff(Long id, Staff updateDto) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Staff existing = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff not found"));

        if (!existing.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied");
        }

        existing.setFirstName(updateDto.getFirstName());
        existing.setLastName(updateDto.getLastName());
        existing.setMobile(updateDto.getMobile());
        existing.setDepartment(updateDto.getDepartment());
        existing.setDesignation(updateDto.getDesignation());
        existing.setShiftId(updateDto.getShiftId());
        existing.setStatus(updateDto.getStatus());

        if (existing.getUserId() != null) {
            Optional<User> userOpt = userRepository.findById(existing.getUserId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setMobile(updateDto.getMobile());
                if ("INACTIVE".equalsIgnoreCase(updateDto.getStatus()) || "SUSPENDED".equalsIgnoreCase(updateDto.getStatus())) {
                    user.setStatus("INACTIVE");
                } else if ("ACTIVE".equalsIgnoreCase(updateDto.getStatus())) {
                    user.setStatus("ACTIVE");
                }
                userRepository.save(user);
            }
        }

        return staffRepository.save(existing);
    }

    @Transactional
    public void resetStaffPassword(Long id, String newPassword) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff not found"));

        if (!staff.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied");
        }

        if (staff.getUserId() != null) {
            User user = userRepository.findById(staff.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User login not found"));
            user.setPassword(passwordUtils.encode(newPassword));
            user.setFailedAttempts(0);
            user.setStatus("ACTIVE");
            userRepository.save(user);
        }
    }

    @Transactional
    public void setStaffStatus(Long id, String status) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff not found"));

        if (!staff.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied");
        }

        staff.setStatus(status);
        staffRepository.save(staff);

        if (staff.getUserId() != null) {
            User user = userRepository.findById(staff.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User login not found"));
            if ("ACTIVE".equalsIgnoreCase(status)) {
                user.setStatus("ACTIVE");
            } else {
                user.setStatus("INACTIVE");
            }
            userRepository.save(user);
        }
    }

    @Transactional
    public void deleteStaff(Long id) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found"));

        if (!staff.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied");
        }

        if (staff.getUserId() != null) {
            userRepository.deleteById(staff.getUserId());
        }
        staffRepository.delete(staff);
    }
}
