package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.model.Farmer;
import com.softedgex.agrisuite.model.FarmerActivity;
import com.softedgex.agrisuite.model.FarmerNote;
import com.softedgex.agrisuite.service.FarmerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/farmers")
public class FarmerController {

    @Autowired
    private FarmerService farmerService;

    @GetMapping
    public ResponseEntity<List<Farmer>> getAllFarmers() {
        return ResponseEntity.ok(farmerService.getFarmers());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Farmer>> searchFarmers(@RequestParam String query) {
        return ResponseEntity.ok(farmerService.searchFarmers(query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Farmer> getFarmerById(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.getFarmerById(id));
    }

    @PostMapping
    public ResponseEntity<Farmer> createFarmer(@RequestBody Farmer farmer) {
        return ResponseEntity.ok(farmerService.createFarmer(farmer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Farmer> updateFarmer(@PathVariable Long id, @RequestBody Farmer farmer) {
        return ResponseEntity.ok(farmerService.updateFarmer(id, farmer));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> setStatus(@PathVariable Long id, @RequestParam String status) {
        farmerService.setFarmerStatus(id, status);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Status updated successfully");
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<FarmerActivity>> getTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.getTimeline(id));
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<List<FarmerNote>> getNotes(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.getNotes(id));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<FarmerNote> addNote(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String noteText = payload.get("note");
        if (noteText == null || noteText.trim().isEmpty()) {
            throw new IllegalArgumentException("Note text cannot be empty");
        }
        return ResponseEntity.ok(farmerService.addNote(id, noteText));
    }

    @PutMapping("/{id}/assign-staff")
    public ResponseEntity<?> assignStaff(@PathVariable Long id, @RequestParam Long staffId) {
        // Mock staff assignment to farmer
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Staff assigned successfully");
        body.put("farmerId", id);
        body.put("staffId", staffId);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/sell")
    public ResponseEntity<Farmer> sellProduct(
            @PathVariable Long id,
            @RequestParam Long productId,
            @RequestParam Double quantity,
            @RequestParam String paymentMethod) {
        return ResponseEntity.ok(farmerService.sellProduct(id, productId, quantity, paymentMethod));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFarmer(@PathVariable Long id) {
        farmerService.deleteFarmer(id);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Farmer profile deleted successfully");
        return ResponseEntity.ok(body);
    }
}
