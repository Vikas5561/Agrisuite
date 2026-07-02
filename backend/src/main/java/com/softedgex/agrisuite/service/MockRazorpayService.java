package com.softedgex.agrisuite.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class MockRazorpayService implements PaymentGatewayService {

    @Override
    public Map<String, Object> createOrder(Long dealerId, Double amount, String receiptId) {
        Map<String, Object> order = new HashMap<>();
        String orderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        order.put("id", orderId);
        order.put("entity", "order");
        order.put("amount", (int) (amount * 100)); // Razorpay processes paise
        order.put("amount_paid", 0);
        order.put("amount_due", (int) (amount * 100));
        order.put("currency", "INR");
        order.put("receipt", receiptId);
        order.put("status", "created");
        order.put("created_at", System.currentTimeMillis() / 1000);
        return order;
    }

    @Override
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        // Since we are mocking, we accept any signature for testing/demonstration
        // In real Razorpay, we verify signature using HMAC-SHA256
        return orderId != null && paymentId != null && signature != null && !signature.isBlank();
    }

    @Override
    public Map<String, Object> refund(String paymentId, Double amount, String reason) {
        Map<String, Object> refund = new HashMap<>();
        String refundId = "rfnd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        refund.put("id", refundId);
        refund.put("entity", "refund");
        refund.put("amount", (int) (amount * 100));
        refund.put("currency", "INR");
        refund.put("payment_id", paymentId);
        refund.put("status", "processed");
        refund.put("speed_processed", "normal");
        refund.put("created_at", System.currentTimeMillis() / 1000);
        return refund;
    }
}
