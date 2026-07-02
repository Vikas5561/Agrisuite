package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/super-admin")
    public ResponseEntity<Map<String, Object>> getSuperAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getSuperAdminDashboard());
    }

    @GetMapping("/dealer-admin")
    public ResponseEntity<Map<String, Object>> getDealerAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getDealerAdminDashboard());
    }

    @GetMapping("/staff")
    public ResponseEntity<Map<String, Object>> getStaffDashboard() {
        return ResponseEntity.ok(dashboardService.getStaffDashboard());
    }
}
