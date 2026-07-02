package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.*;
import com.softedgex.agrisuite.repository.*;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private SalesInvoiceRepository salesInvoiceRepository;

    @Autowired
    private PurchaseEntryRepository purchaseEntryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private CreditCollectionRepository creditCollectionRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private VisitRepository visitRepository;

    public Map<String, Object> getSummary() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        Map<String, Object> reports = new HashMap<>();

        // 1. Sales Report
        List<SalesInvoice> invoices = salesInvoiceRepository.findByDealerIdOrderByCreatedAtDesc(dealerId);
        double totalSalesRevenue = invoices.stream().mapToDouble(SalesInvoice::getTotalAmount).sum();
        double totalSalesGst = invoices.stream().mapToDouble(SalesInvoice::getGst).sum();
        
        Map<String, Double> paymentModeSummary = invoices.stream()
                .collect(Collectors.groupingBy(
                        SalesInvoice::getPaymentMethod,
                        Collectors.summingDouble(SalesInvoice::getTotalAmount)
                ));

        // Group monthly sales (e.g. "2026-06")
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, Double> monthlySales = invoices.stream()
                .collect(Collectors.groupingBy(
                        inv -> inv.getCreatedAt().format(monthFormatter),
                        Collectors.summingDouble(SalesInvoice::getTotalAmount)
                ));

        Map<String, Object> salesReport = new HashMap<>();
        salesReport.put("totalRevenue", totalSalesRevenue);
        salesReport.put("totalTaxCollected", totalSalesGst);
        salesReport.put("invoiceCount", invoices.size());
        salesReport.put("paymentModeSummary", paymentModeSummary);
        salesReport.put("monthlySales", monthlySales);
        salesReport.put("recentInvoices", invoices.stream().limit(10).collect(Collectors.toList()));
        reports.put("sales", salesReport);

        // 2. Purchase Report
        List<PurchaseEntry> purchases = purchaseEntryRepository.findByDealerIdOrderByCreatedAtDesc(dealerId);
        double totalPurchaseCost = purchases.stream().mapToDouble(PurchaseEntry::getTotalAmount).sum();
        
        Map<String, Double> supplierPurchases = purchases.stream()
                .collect(Collectors.groupingBy(
                        PurchaseEntry::getSupplierName,
                        Collectors.summingDouble(PurchaseEntry::getTotalAmount)
                ));

        Map<String, Object> purchaseReport = new HashMap<>();
        purchaseReport.put("totalCost", totalPurchaseCost);
        purchaseReport.put("purchaseCount", purchases.size());
        purchaseReport.put("supplierPurchases", supplierPurchases);
        purchaseReport.put("recentPurchases", purchases.stream().limit(10).collect(Collectors.toList()));
        reports.put("purchases", purchaseReport);

        // 3. Inventory Valuation
        List<Product> products = productRepository.findByDealerId(dealerId);
        double totalStockValue = products.stream()
                .mapToDouble(p -> (p.getStock() != null ? p.getStock() : 0.0) * (p.getPurchasePrice() != null ? p.getPurchasePrice() : 0.0))
                .sum();
        long lowStockCount = products.stream()
                .filter(p -> p.getStock() <= p.getMinimumStock())
                .count();

        Map<String, Object> inventoryReport = new HashMap<>();
        inventoryReport.put("totalStockValue", totalStockValue);
        inventoryReport.put("totalProductTypes", products.size());
        inventoryReport.put("lowStockCount", lowStockCount);
        inventoryReport.put("productsCatalog", products);
        reports.put("inventory", inventoryReport);

        // 4. Credit (Udhar) Summary
        List<Farmer> farmers = farmerRepository.findByDealerId(dealerId);
        double totalOutstandingCredit = farmers.stream()
                .mapToDouble(f -> f.getOutstandingCredit() != null ? f.getOutstandingCredit() : 0.0)
                .sum();

        List<CreditCollection> collections = creditCollectionRepository.findByDealerIdOrderByCollectedAtDesc(dealerId);
        double totalCollections = collections.stream().mapToDouble(CreditCollection::getAmount).sum();

        Map<String, Object> creditReport = new HashMap<>();
        creditReport.put("totalOutstandingCredit", totalOutstandingCredit);
        creditReport.put("totalCollections", totalCollections);
        creditReport.put("collectionsHistory", collections.stream().limit(10).collect(Collectors.toList()));
        reports.put("credit", creditReport);

        // 5. Staff Performance Reports
        List<Staff> staffMembers = staffRepository.findByDealerId(dealerId);
        List<Map<String, Object>> staffReportList = new ArrayList<>();
        for (Staff staff : staffMembers) {
            Map<String, Object> sm = new HashMap<>();
            sm.put("staffName", staff.getFirstName() + " " + staff.getLastName());
            sm.put("employeeCode", staff.getEmployeeCode());
            sm.put("status", staff.getStatus());
            
            // Count field advisory visits completed by this staff member
            long visitsCount = visitRepository.findByStaffIdOrderByVisitDateDesc(staff.getId()).stream()
                    .filter(v -> "COMPLETED".equalsIgnoreCase(v.getStatus()))
                    .count();
            sm.put("visitsCount", visitsCount);
            
            staffReportList.add(sm);
        }
        reports.put("staff", staffReportList);

        // 6. Gross Profit Estimate
        double estimatedProfit = totalSalesRevenue - totalPurchaseCost;
        reports.put("estimatedProfit", estimatedProfit);

        return reports;
    }
}
