package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.dto.SalesInvoiceRequest;
import com.softedgex.agrisuite.model.SalesInvoice;
import com.softedgex.agrisuite.service.SalesInvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sales")
public class SalesInvoiceController {

    @Autowired
    private SalesInvoiceService salesInvoiceService;

    @GetMapping("/history")
    public ResponseEntity<List<SalesInvoice>> getSalesHistory() {
        return ResponseEntity.ok(salesInvoiceService.getSalesHistory());
    }

    @PostMapping("/create")
    public ResponseEntity<SalesInvoice> createSalesInvoice(@RequestBody SalesInvoiceRequest request) {
        return ResponseEntity.ok(salesInvoiceService.createSalesInvoice(request));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<SalesInvoice>> getSalesByFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(salesInvoiceService.getSalesByFarmer(farmerId));
    }
}
