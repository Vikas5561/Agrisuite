package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.exception.AccessDeniedException;
import com.softedgex.agrisuite.model.Farmer;
import com.softedgex.agrisuite.model.Notification;
import com.softedgex.agrisuite.model.Dealer;
import com.softedgex.agrisuite.repository.FarmerRepository;
import com.softedgex.agrisuite.repository.NotificationRepository;
import com.softedgex.agrisuite.repository.DealerRepository;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private TwilioService twilioService;

    public List<Notification> getNotifications() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }
        return notificationRepository.findByDealerIdOrderBySentAtDesc(dealerId);
    }

    private String resolveTemplate(String message, Farmer farmer, Long dealerId) {
        if (message == null) return "";
        String resolved = message;
        if (farmer != null) {
            String farmerName = farmer.getFirstName() + " " + farmer.getLastName();
            resolved = resolved.replaceAll("(?i)\\{\\{\\s*farmer\\s*name\\s*\\}\\}", farmerName);
            resolved = resolved.replaceAll("(?i)\\{\\{\\s*farmername\\s*\\}\\}", farmerName);
            
            String amtStr = String.format("%,.2f", farmer.getOutstandingCredit() != null ? farmer.getOutstandingCredit() : 0.0);
            resolved = resolved.replaceAll("(?i)\\{\\{\\s*amount\\s*\\}\\}", amtStr);
        }
        if (dealerId != null) {
            Optional<Dealer> dealerOpt = dealerRepository.findById(dealerId);
            if (dealerOpt.isPresent()) {
                Dealer dealer = dealerOpt.get();
                String bizName = dealer.getBusinessName();
                resolved = resolved.replaceAll("(?i)\\{\\{\\s*dealer\\s*name\\s*\\}\\}", bizName);
                resolved = resolved.replaceAll("(?i)\\{\\{\\s*delear\\s*name\\s*\\}\\}", bizName);
                resolved = resolved.replaceAll("(?i)\\{\\{\\s*dealername\\s*\\}\\}", bizName);
                
                // Automatically append dealer sender contact details to the message signature
                String footer = "\n\nSent by: " + bizName;
                if (dealer.getMobile() != null && !dealer.getMobile().isBlank()) {
                    footer += "\nMobile: " + dealer.getMobile();
                }
                if (dealer.getEmail() != null && !dealer.getEmail().isBlank()) {
                    footer += "\nEmail: " + dealer.getEmail();
                }
                
                if (!resolved.contains(bizName)) {
                    resolved = resolved + footer;
                }
            }
        }
        return resolved;
    }

    @Transactional
    public Notification sendNotification(Notification notification) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        // Validate subscription
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. Cannot send notifications.");
        }

        notification.setDealerId(dealerId);
        return notificationRepository.save(notification);
    }

    @Transactional
    public List<Notification> sendBroadcast(List<Long> farmerIds, String channel, String message) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new AccessDeniedException("No dealer context found");
        }

        // Validate subscription
        if (!subscriptionService.checkFeatureAccess(dealerId)) {
            throw new AccessDeniedException("Your subscription has expired or is in the Grace Period. Cannot send notifications.");
        }

        List<Notification> loggedNotifications = new ArrayList<>();

        for (Long farmerId : farmerIds) {
            Farmer farmer = farmerRepository.findById(farmerId)
                    .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found for ID: " + farmerId));
            
            if (!farmer.getDealerId().equals(dealerId)) {
                throw new AccessDeniedException("Access denied to farmer profile: " + farmerId);
            }

            String resolvedMsg = resolveTemplate(message, farmer, dealerId);

            boolean dispatched = false;
            if ("SMS".equalsIgnoreCase(channel)) {
                dispatched = twilioService.sendSms(farmer.getMobile(), resolvedMsg);
            } else if ("WHATSAPP".equalsIgnoreCase(channel)) {
                dispatched = twilioService.sendWhatsApp(farmer.getMobile(), resolvedMsg);
            } else {
                dispatched = true;
            }

            Notification notification = Notification.builder()
                    .dealerId(dealerId)
                    .recipientName(farmer.getFirstName() + " " + farmer.getLastName())
                    .channel(channel)
                    .message(resolvedMsg)
                    .status(dispatched ? "SENT" : "FAILED")
                    .build();

            loggedNotifications.add(notificationRepository.save(notification));
        }

        return loggedNotifications;
    }
}
