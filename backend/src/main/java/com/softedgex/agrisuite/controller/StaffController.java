package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.model.Staff;
import com.softedgex.agrisuite.service.StaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/staff")
public class StaffController {

    @Autowired
    private StaffService staffService;

    @GetMapping
    public ResponseEntity<List<Staff>> getAllStaff() {
        return ResponseEntity.ok(staffService.getStaffByDealer());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Staff> getStaffById(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.getStaffById(id));
    }

    @PostMapping
    public ResponseEntity<Staff> createStaff(@RequestBody Staff staff) {
        return ResponseEntity.ok(staffService.createStaff(staff));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Staff> updateStaff(@PathVariable Long id, @RequestBody Staff staff) {
        return ResponseEntity.ok(staffService.updateStaff(id, staff));
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<?> suspendStaff(@PathVariable Long id) {
        staffService.setStaffStatus(id, "SUSPENDED");
        Map<String, String> body = new HashMap<>();
        body.put("message", "Staff member suspended successfully");
        return ResponseEntity.ok(body);
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> requestBody) {
        String newPassword = requestBody.get("password");
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        staffService.resetStaffPassword(id, newPassword);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Password reset successfully");
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/permissions")
    public ResponseEntity<?> assignPermissions(@PathVariable Long id, @RequestBody List<String> permissions) {
        // Mock permission assigning workflow
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Permissions updated successfully");
        body.put("permissions", permissions);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/farmers")
    public ResponseEntity<?> assignFarmers(@PathVariable Long id, @RequestBody List<Long> farmerIds) {
        // Mock farmer assignment mapping workflow
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Farmers assigned successfully");
        body.put("farmerIds", farmerIds);
        return ResponseEntity.ok(body);
    }
}
