package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.model.Notification;
import com.softedgex.agrisuite.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getNotifications());
    }

    @PostMapping("/broadcast")
    public ResponseEntity<List<Notification>> sendBroadcast(@RequestBody Map<String, Object> payload) {
        List<?> rawFarmerIds = (List<?>) payload.get("farmerIds");
        List<Long> farmerIds = rawFarmerIds.stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());

        String channel = (String) payload.get("channel");
        String message = (String) payload.get("message");

        if (channel == null || channel.isBlank()) {
            throw new IllegalArgumentException("Channel is required");
        }
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message content is required");
        }

        List<Notification> sentNotifications = notificationService.sendBroadcast(farmerIds, channel, message);
        return ResponseEntity.ok(sentNotifications);
    }
}
