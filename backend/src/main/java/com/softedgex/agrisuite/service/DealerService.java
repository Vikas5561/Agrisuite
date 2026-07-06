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
public class DealerService {

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private DealerSettingsRepository dealerSettingsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordUtils passwordUtils;

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private DealerSubscriptionRepository subscriptionRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    private String getInvoiceDateStr() {
        LocalDateTime now = LocalDateTime.now();
        return String.format("%d%02d%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
    }

    public List<Dealer> getAllDealers() {
        if (!SecurityUtils.isSuperAdmin()) {
            throw new AccessDeniedException("Only Super Admin can view all dealers");
        }
        return dealerRepository.findAll();
    }

    public Dealer getDealerById(Long id) {
        if (!SecurityUtils.isSuperAdmin()) {
            Long currentDealerId = SecurityUtils.getCurrentDealerId();
            if (!id.equals(currentDealerId)) {
                throw new AccessDeniedException("You can only access your own profile");
            }
        }
        return dealerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dealer not found with ID: " + id));
    }

    @Transactional
    public Dealer createDealer(Dealer dealerDto, Long initialPlanId) {
        if (!SecurityUtils.isSuperAdmin()) {
            throw new AccessDeniedException("Only Super Admin can register dealers");
        }

        // Validate duplicates
        if (dealerRepository.findByEmail(dealerDto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }
        if (dealerRepository.findByMobile(dealerDto.getMobile()).isPresent()) {
            throw new IllegalArgumentException("Mobile number is already registered");
        }

        // Generate dealer code
        long count = dealerRepository.count();
        String dealerCode = String.format("DLR%06d", count + 1);
        dealerDto.setDealerCode(dealerCode);
        dealerDto.setStatus("ACTIVE");

        Dealer savedDealer = dealerRepository.save(dealerDto);

        // Save default settings
        DealerSettings settings = DealerSettings.builder()
                .dealerId(savedDealer.getId())
                .language("English")
                .currency("INR")
                .timezone("Asia/Kolkata")
                .financialYear("April-March")
                .dateFormat("dd-MM-yyyy")
                .businessHours("10 AM - 6 PM")
                .build();
        dealerSettingsRepository.save(settings);

        // Fetch Dealer Admin Role
        Role dealerAdminRole = roleRepository.findByRoleName("DEALER_ADMIN")
                .orElseGet(() -> {
                    Role role = Role.builder().roleName("DEALER_ADMIN").description("Dealer Admin role").build();
                    return roleRepository.save(role);
                });

        // Create Dealer Admin User
        User user = User.builder()
                .dealerId(savedDealer.getId())
                .role(dealerAdminRole)
                .username(dealerCode.toLowerCase())
                .email(savedDealer.getEmail())
                .mobile(savedDealer.getMobile())
                .password(passwordUtils.encode("Welcome@123")) // Default temporary password
                .status("ACTIVE")
                .build();
        userRepository.save(user);

        // Assign Subscription Plan
        SubscriptionPlan plan = planRepository.findById(initialPlanId)
                .orElseThrow(() -> new IllegalArgumentException("Selected plan not found"));

        DealerSubscription sub = DealerSubscription.builder()
                .dealerId(savedDealer.getId())
                .plan(plan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusMonths(plan.getDurationMonths()))
                .graceEndDate(LocalDateTime.now().plusMonths(plan.getDurationMonths()).plusDays(7))
                .status("ACTIVE")
                .autoRenew(false)
                .build();
        DealerSubscription savedSub = subscriptionRepository.save(sub);

        // Create successful Payment & Invoice records
        Double amount = plan.getPrice();
        Double gst = amount * 0.18;
        Double total = amount + gst;

        Payment payment = Payment.builder()
                .dealerId(savedDealer.getId())
                .subscriptionId(savedSub.getId())
                .orderId("order_admin_" + System.currentTimeMillis())
                .paymentId("pay_admin_" + System.currentTimeMillis())
                .gateway("Admin_Manual")
                .amount(amount)
                .gst(gst)
                .totalAmount(total)
                .status("SUCCESS")
                .paymentMethod("UPI")
                .paymentDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        Payment savedPayment = paymentRepository.save(payment);

        String invoiceNum = "INV-" + getInvoiceDateStr() + "-" + String.format("%04d", savedPayment.getId());
        Invoice invoice = Invoice.builder()
                .dealerId(savedDealer.getId())
                .invoiceNumber(invoiceNum)
                .paymentId(savedPayment.getId())
                .amount(payment.getAmount())
                .gst(payment.getGst())
                .pdfPath("/api/v1/payments/invoice/download/" + invoiceNum)
                .build();
        invoiceRepository.save(invoice);

        return savedDealer;
    }

    @Transactional
    public Dealer updateDealer(Long id, Dealer updateDto) {
        Dealer existing = dealerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dealer not found"));

        if (!SecurityUtils.isSuperAdmin()) {
            Long currentDealerId = SecurityUtils.getCurrentDealerId();
            if (!id.equals(currentDealerId)) {
                throw new AccessDeniedException("You can only modify your own business profile");
            }
            
            // Dealer Admin restrictions
            existing.setBusinessName(updateDto.getBusinessName());
            existing.setOwnerName(updateDto.getOwnerName());
            existing.setGstNumber(updateDto.getGstNumber());
            existing.setPanNumber(updateDto.getPanNumber());
            existing.setShopLicenseNumber(updateDto.getShopLicenseNumber());
            existing.setMobile(updateDto.getMobile());
            existing.setAddress(updateDto.getAddress());
            existing.setVillage(updateDto.getVillage());
            existing.setTaluka(updateDto.getTaluka());
            existing.setDistrict(updateDto.getDistrict());
            existing.setState(updateDto.getState());
            existing.setPinCode(updateDto.getPinCode());
            existing.setLogoUrl(updateDto.getLogoUrl());
        } else {
            existing.setBusinessName(updateDto.getBusinessName());
            existing.setOwnerName(updateDto.getOwnerName());
            existing.setGstNumber(updateDto.getGstNumber());
            existing.setPanNumber(updateDto.getPanNumber());
            existing.setShopLicenseNumber(updateDto.getShopLicenseNumber());
            existing.setEmail(updateDto.getEmail());
            existing.setMobile(updateDto.getMobile());
            existing.setAddress(updateDto.getAddress());
            existing.setVillage(updateDto.getVillage());
            existing.setTaluka(updateDto.getTaluka());
            existing.setDistrict(updateDto.getDistrict());
            existing.setState(updateDto.getState());
            existing.setPinCode(updateDto.getPinCode());
            existing.setLogoUrl(updateDto.getLogoUrl());
            existing.setStatus(updateDto.getStatus());
        }

        return dealerRepository.save(existing);
    }

    @Transactional
    public void setDealerStatus(Long id, String status) {
        if (!SecurityUtils.isSuperAdmin()) {
            throw new AccessDeniedException("Only Super Admin can alter dealer status");
        }
        Dealer dealer = dealerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dealer not found"));
        dealer.setStatus(status);
        dealerRepository.save(dealer);
    }

    public DealerSettings getSettingsByDealerId(Long dealerId) {
        if (!SecurityUtils.isSuperAdmin() && !dealerId.equals(SecurityUtils.getCurrentDealerId())) {
            throw new AccessDeniedException("Access denied to settings");
        }
        return dealerSettingsRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("Settings not found"));
    }

    @Transactional
    public DealerSettings updateSettings(Long dealerId, DealerSettings settings) {
        if (!SecurityUtils.isSuperAdmin() && !dealerId.equals(SecurityUtils.getCurrentDealerId())) {
            throw new AccessDeniedException("Access denied to settings");
        }
        settings.setDealerId(dealerId);
        return dealerSettingsRepository.save(settings);
    }

    @Transactional
    public void resetDealerPassword(Long dealerId, String newPassword) {
        if (!SecurityUtils.isSuperAdmin()) {
            throw new AccessDeniedException("Only Super Admin can reset dealer passwords");
        }
        List<User> users = userRepository.findByDealerId(dealerId);
        User dealerAdmin = users.stream()
                .filter(u -> "DEALER_ADMIN".equalsIgnoreCase(u.getRole().getRoleName()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Dealer admin user account not found"));

        dealerAdmin.setPassword(passwordUtils.encode(newPassword));
        userRepository.save(dealerAdmin);
    }
}
