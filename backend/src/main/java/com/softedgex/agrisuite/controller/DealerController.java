package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.model.Dealer;
import com.softedgex.agrisuite.model.DealerSettings;
import com.softedgex.agrisuite.service.DealerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dealers")
public class DealerController {

    @Autowired
    private DealerService dealerService;

    @GetMapping
    public ResponseEntity<List<Dealer>> getAllDealers() {
        return ResponseEntity.ok(dealerService.getAllDealers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Dealer> getDealerById(@PathVariable Long id) {
        return ResponseEntity.ok(dealerService.getDealerById(id));
    }

    @PostMapping
    public ResponseEntity<Dealer> createDealer(@RequestBody Dealer dealer, @RequestParam Long planId) {
        return ResponseEntity.ok(dealerService.createDealer(dealer, planId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Dealer> updateDealer(@PathVariable Long id, @RequestBody Dealer dealer) {
        return ResponseEntity.ok(dealerService.updateDealer(id, dealer));
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<?> suspendDealer(@PathVariable Long id) {
        dealerService.setDealerStatus(id, "SUSPENDED");
        Map<String, String> body = new HashMap<>();
        body.put("message", "Dealer has been suspended successfully");
        return ResponseEntity.ok(body);
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateDealer(@PathVariable Long id) {
        dealerService.setDealerStatus(id, "ACTIVE");
        Map<String, String> body = new HashMap<>();
        body.put("message", "Dealer has been activated successfully");
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}/settings")
    public ResponseEntity<DealerSettings> getSettings(@PathVariable Long id) {
        return ResponseEntity.ok(dealerService.getSettingsByDealerId(id));
    }

    @PutMapping("/{id}/settings")
    public ResponseEntity<DealerSettings> updateSettings(@PathVariable Long id, @RequestBody DealerSettings settings) {
        return ResponseEntity.ok(dealerService.updateSettings(id, settings));
    }

    @PostMapping("/logo")
    public ResponseEntity<?> uploadLogo(@RequestParam("logoUrl") String logoUrl) {
        // Since we are mocking file storage, we accept a URL directly to make things easier
        Map<String, String> body = new HashMap<>();
        body.put("logoUrl", logoUrl);
        body.put("message", "Logo updated successfully");
        return ResponseEntity.ok(body);
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<?> resetDealerPassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newPassword = payload.get("password");
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        dealerService.resetDealerPassword(id, newPassword);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Dealer password reset successfully");
        return ResponseEntity.ok(body);
    }
}
