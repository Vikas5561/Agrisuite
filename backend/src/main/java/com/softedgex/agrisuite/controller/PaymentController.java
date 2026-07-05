package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.model.Invoice;
import com.softedgex.agrisuite.model.Payment;
import com.softedgex.agrisuite.model.Refund;
import com.softedgex.agrisuite.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/config-check")
    public ResponseEntity<Map<String, Object>> configCheck() {
        return ResponseEntity.ok(paymentService.getSystemConfigDiagnostics());
    }

    @GetMapping("/history")
    public ResponseEntity<List<Payment>> getPaymentHistory() {
        return ResponseEntity.ok(paymentService.getPaymentHistory());
    }

    @PostMapping("/order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestParam Long planId) {
        return ResponseEntity.ok(paymentService.createPaymentOrder(planId));
    }

    @PostMapping("/verify")
    public ResponseEntity<Payment> verifyPayment(@RequestBody Map<String, String> request) {
        String orderId = request.get("orderId");
        String paymentId = request.get("paymentId");
        String signature = request.get("signature");
        Long planId = Long.parseLong(request.get("planId"));

        return ResponseEntity.ok(paymentService.verifyPayment(orderId, paymentId, signature, planId));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody Map<String, Object> payload) {
        paymentService.processWebhook(payload);
        return ResponseEntity.ok(Map.of("message", "Webhook processed"));
    }

    @GetMapping("/invoice/{paymentId}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.getInvoiceByPaymentId(paymentId));
    }

    @PostMapping("/refund")
    public ResponseEntity<Refund> refund(@RequestParam Long paymentId, @RequestParam String reason) {
        return ResponseEntity.ok(paymentService.initiateRefund(paymentId, reason));
    }
}
