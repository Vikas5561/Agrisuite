package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.*;
import com.softedgex.agrisuite.repository.*;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin")
public class PlatformAdminController {

    @Autowired
    private LoginAuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @GetMapping("/audit-logs")
    public ResponseEntity<List<LoginAuditLog>> getAuditLogs() {
        if (SecurityUtils.isSuperAdmin()) {
            return ResponseEntity.ok(auditLogRepository.findAll());
        }
        
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        return ResponseEntity.ok(auditLogRepository.findByDealerIdOrderByTimestampDesc(dealerId));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getActiveSessions() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        List<User> dealerUsers = userRepository.findByDealerId(dealerId);
        List<Map<String, Object>> activeSessionsList = new ArrayList<>();

        for (User user : dealerUsers) {
            List<UserSession> sessions = userSessionRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");
            for (UserSession session : sessions) {
                Map<String, Object> map = new HashMap<>();
                map.put("sessionId", session.getSessionId());
                map.put("username", user.getUsername());
                map.put("ipAddress", session.getIpAddress());
                map.put("device", session.getDevice());
                map.put("browser", session.getBrowser());
                map.put("loginTime", session.getLoginTime());
                map.put("status", session.getStatus());
                activeSessionsList.add(map);
            }
        }

        return ResponseEntity.ok(activeSessionsList);
    }

    @PostMapping("/sessions/{sessionId}/terminate")
    @Transactional
    public ResponseEntity<?> terminateSession(@PathVariable String sessionId) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        UserSession session = userSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // Verify session belongs to one of the dealer's users
        User sessionUser = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Session user not found"));

        if (!sessionUser.getDealerId().equals(dealerId)) {
            throw new AccessDeniedException("Access denied to session");
        }

        session.setStatus("LOGGED_OUT");
        session.setLogoutTime(LocalDateTime.now());
        userSessionRepository.save(session);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Session terminated successfully");
        return ResponseEntity.ok(response);
    }
}
