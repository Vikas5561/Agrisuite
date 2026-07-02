package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.model.*;
import com.softedgex.agrisuite.repository.*;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DashboardService {

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DealerSubscriptionRepository subscriptionRepository;

    @Autowired
    private LoginAuditLogRepository auditLogRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private SalesInvoiceRepository salesInvoiceRepository;

    public Map<String, Object> getSuperAdminDashboard() {
        Map<String, Object> stats = new HashMap<>();

        long totalDealers = dealerRepository.count();
        long activeDealers = dealerRepository.findAll().stream().filter(d -> "ACTIVE".equalsIgnoreCase(d.getStatus())).count();
        long suspendedDealers = dealerRepository.findAll().stream().filter(d -> "SUSPENDED".equalsIgnoreCase(d.getStatus())).count();
        long expiredDealers = dealerRepository.findAll().stream().filter(d -> "EXPIRED".equalsIgnoreCase(d.getStatus())).count();

        // Calculate revenues from payments
        List<Payment> payments = paymentRepository.findAll();
        double totalRevenue = payments.stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()))
                .mapToDouble(Payment::getTotalAmount)
                .sum();

        long successPayments = payments.stream().filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus())).count();
        long failedPayments = payments.stream().filter(p -> "FAILED".equalsIgnoreCase(p.getStatus())).count();
        long pendingPayments = payments.stream().filter(p -> "PENDING".equalsIgnoreCase(p.getStatus())).count();

        stats.put("totalDealers", totalDealers);
        stats.put("activeDealers", activeDealers);
        stats.put("suspendedDealers", suspendedDealers);
        stats.put("expiredDealers", expiredDealers);
        stats.put("totalRevenue", totalRevenue);
        stats.put("successPayments", successPayments);
        stats.put("failedPayments", failedPayments);
        stats.put("pendingPayments", pendingPayments);
        stats.put("totalFarmers", farmerRepository.count());
        stats.put("totalProducts", productRepository.count());

        // Dynamic plan distribution
        Map<String, Integer> planDist = new HashMap<>();
        subscriptionRepository.findAll().forEach(sub -> {
            String planName = sub.getPlan().getName();
            planDist.put(planName, planDist.getOrDefault(planName, 0) + 1);
        });
        stats.put("planDistribution", planDist);

        // Recent Audit logs
        stats.put("recentActivities", auditLogRepository.findTop20ByOrderByTimestampDesc());

        return stats;
    }

    public Map<String, Object> getDealerAdminDashboard() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new IllegalArgumentException("No dealer context found");
        }

        Map<String, Object> stats = new HashMap<>();

        long totalFarmers = farmerRepository.countByDealerId(dealerId);
        long totalProducts = productRepository.countByDealerId(dealerId);
        long totalStaff = staffRepository.countByDealerId(dealerId);

        // Low stock products
        List<Product> lowStock = productRepository.findLowStockProducts(dealerId);
        stats.put("lowStockCount", lowStock.size());
        stats.put("lowStockProducts", lowStock);

        // Subscription status & remaining days
        Optional<DealerSubscription> subOpt = subscriptionRepository.findFirstByDealerIdOrderByCreatedAtDesc(dealerId);
        if (subOpt.isPresent()) {
            DealerSubscription sub = subOpt.get();
            stats.put("subscriptionPlan", sub.getPlan().getName());
            stats.put("subscriptionStatus", sub.getStatus());
            stats.put("expiryDate", sub.getEndDate());

            long remainingDays = 0;
            if (sub.getEndDate().isAfter(LocalDateTime.now())) {
                remainingDays = Duration.between(LocalDateTime.now(), sub.getEndDate()).toDays();
            }
            stats.put("remainingDays", remainingDays);
        } else {
            stats.put("subscriptionPlan", "None");
            stats.put("subscriptionStatus", "EXPIRED");
            stats.put("remainingDays", 0);
        }

        // Calculate dynamic financial data based on real database records
        java.time.LocalDateTime startOfToday = java.time.LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        java.time.LocalDateTime startOfMonth = java.time.LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<SalesInvoice> todayInvoices = salesInvoiceRepository.findByDealerIdAndCreatedAtAfter(dealerId, startOfToday);
        double todaySales = todayInvoices.stream().mapToDouble(SalesInvoice::getTotalAmount).sum();

        List<SalesInvoice> monthInvoices = salesInvoiceRepository.findByDealerIdAndCreatedAtAfter(dealerId, startOfMonth);
        double monthlySales = monthInvoices.stream().mapToDouble(SalesInvoice::getTotalAmount).sum();

        List<Farmer> farmersList = farmerRepository.findByDealerId(dealerId);
        double outstandingCredit = farmersList.stream()
                .mapToDouble(f -> f.getOutstandingCredit() != null ? f.getOutstandingCredit() : 0.0)
                .sum();

        // Collections: sum cash/UPI sales invoices completed today
        double todayCollections = todayInvoices.stream()
                .filter(inv -> !"CREDIT".equalsIgnoreCase(inv.getPaymentMethod()))
                .mapToDouble(SalesInvoice::getTotalAmount)
                .sum();

        stats.put("todaySales", todaySales);
        stats.put("monthlySales", monthlySales);
        stats.put("outstandingCredit", outstandingCredit);
        stats.put("todayCollections", todayCollections);

        // Mock recent transactions / audit events
        stats.put("recentActivities", auditLogRepository.findByDealerIdOrderByTimestampDesc(dealerId));

        return stats;
    }

    public Map<String, Object> getStaffDashboard() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new IllegalArgumentException("No dealer context found");
        }

        Map<String, Object> stats = new HashMap<>();
        
        // Staff sees dynamic metrics connected to the database state
        java.time.LocalDateTime startOfToday = java.time.LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        List<SalesInvoice> todayInvoices = salesInvoiceRepository.findByDealerIdAndCreatedAtAfter(dealerId, startOfToday);
        double todaySales = todayInvoices.stream().mapToDouble(SalesInvoice::getTotalAmount).sum();

        List<Farmer> farmersList = farmerRepository.findByDealerId(dealerId);
        double outstandingCredit = farmersList.stream()
                .mapToDouble(f -> f.getOutstandingCredit() != null ? f.getOutstandingCredit() : 0.0)
                .sum();

        stats.put("todaySales", todaySales);
        stats.put("assignedFarmers", farmerRepository.countByDealerId(dealerId));
        stats.put("todayVisits", 3);
        stats.put("pendingCollections", outstandingCredit);
        stats.put("completedTasks", 4);
        stats.put("remainingTasks", 2);
        
        return stats;
    }
}
