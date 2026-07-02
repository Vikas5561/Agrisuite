package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.model.PurchaseEntry;
import com.softedgex.agrisuite.service.PurchaseEntryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/purchases")
public class PurchaseEntryController {

    @Autowired
    private PurchaseEntryService purchaseEntryService;

    @GetMapping
    public ResponseEntity<List<PurchaseEntry>> getAllPurchases() {
        return ResponseEntity.ok(purchaseEntryService.getPurchaseEntries());
    }

    @PostMapping
    public ResponseEntity<PurchaseEntry> createPurchase(@RequestBody PurchaseEntry entry) {
        return ResponseEntity.ok(purchaseEntryService.createPurchaseEntry(entry));
    }
}
