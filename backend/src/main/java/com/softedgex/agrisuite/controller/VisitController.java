package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.model.Visit;
import com.softedgex.agrisuite.service.VisitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/visits")
public class VisitController {

    @Autowired
    private VisitService visitService;

    @GetMapping
    public ResponseEntity<List<Visit>> getAllVisits() {
        return ResponseEntity.ok(visitService.getVisits());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Visit> getVisitById(@PathVariable Long id) {
        return ResponseEntity.ok(visitService.getVisitById(id));
    }

    @PostMapping
    public ResponseEntity<Visit> createVisit(@RequestBody Visit visit) {
        return ResponseEntity.ok(visitService.createVisit(visit));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Visit> updateVisit(@PathVariable Long id, @RequestBody Visit visit) {
        return ResponseEntity.ok(visitService.updateVisit(id, visit));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<Visit> verifyVisit(@PathVariable Long id) {
        return ResponseEntity.ok(visitService.verifyVisit(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVisit(@PathVariable Long id) {
        visitService.deleteVisit(id);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Visit report deleted successfully");
        return ResponseEntity.ok(body);
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<Visit>> getVisitsByFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(visitService.getVisitsByFarmer(farmerId));
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<Visit>> getVisitsByStaff(@PathVariable Long staffId) {
        return ResponseEntity.ok(visitService.getVisitsByStaff(staffId));
    }
}
