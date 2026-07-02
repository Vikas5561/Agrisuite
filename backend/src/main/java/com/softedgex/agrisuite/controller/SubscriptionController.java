package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.model.DealerSubscription;
import com.softedgex.agrisuite.model.SubscriptionPlan;
import com.softedgex.agrisuite.service.SubscriptionService;
import com.softedgex.agrisuite.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getPlans());
    }

    @GetMapping("/current")
    public ResponseEntity<DealerSubscription> getCurrentSubscription() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new IllegalArgumentException("No dealer context found");
        }
        return ResponseEntity.ok(subscriptionService.getCurrentSubscription(dealerId));
    }

    @PostMapping("/renew")
    public ResponseEntity<DealerSubscription> renewSubscription(@RequestParam Long planId) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new IllegalArgumentException("No dealer context");
        }
        return ResponseEntity.ok(subscriptionService.renewSubscription(dealerId, planId));
    }

    @PostMapping("/upgrade")
    public ResponseEntity<DealerSubscription> upgradeSubscription(@RequestParam Long planId) {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new IllegalArgumentException("No dealer context");
        }
        return ResponseEntity.ok(subscriptionService.upgradeSubscription(dealerId, planId));
    }

    @PostMapping("/cancel")
    public ResponseEntity<DealerSubscription> cancelSubscription() {
        Long dealerId = SecurityUtils.getCurrentDealerId();
        if (dealerId == null) {
            throw new IllegalArgumentException("No dealer context");
        }
        return ResponseEntity.ok(subscriptionService.cancelSubscription(dealerId));
    }

    @PostMapping("/extend")
    public ResponseEntity<DealerSubscription> extendSubscription(@RequestParam Long dealerId, @RequestParam int months) {
        return ResponseEntity.ok(subscriptionService.extendSubscription(dealerId, months));
    }

    @PutMapping("/plans/{id}")
    public ResponseEntity<SubscriptionPlan> updatePlan(@PathVariable Long id, @RequestBody SubscriptionPlan plan) {
        return ResponseEntity.ok(subscriptionService.updatePlan(id, plan));
    }

    @PostMapping("/plans")
    public ResponseEntity<SubscriptionPlan> createPlan(@RequestBody SubscriptionPlan plan) {
        return ResponseEntity.ok(subscriptionService.createPlan(plan));
    }
}
