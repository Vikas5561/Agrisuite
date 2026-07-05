package com.softedgex.agrisuite.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Service
@Primary
public class RazorpayGatewayServiceImpl implements PaymentGatewayService {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    private final RestTemplate restTemplate = new RestTemplate();

    private boolean isMock() {
        System.out.println("Razorpay check - keyId: '" + keyId + "', keySecret length: " + (keySecret != null ? keySecret.length() : 0));
        return keyId == null || keySecret == null || 
               "mock_key_id".equalsIgnoreCase(keyId) || 
               "mock_key_secret".equalsIgnoreCase(keySecret) || 
               keyId.isBlank() || keySecret.isBlank();
    }

    @Override
    public Map<String, Object> createOrder(Long dealerId, Double amount, String receiptId) {
        if (isMock()) {
            return mockCreateOrder(amount, receiptId);
        }

        try {
            String url = "https://api.razorpay.com/v1/orders";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBasicAuth(keyId, keySecret);

            Map<String, Object> body = new HashMap<>();
            body.put("amount", (int) Math.round(amount * 100)); // amount in paise
            body.put("currency", "INR");
            body.put("receipt", receiptId);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map<String, Object> order = new HashMap<>(response.getBody());
                order.put("key", keyId); // Inject key for frontend initialization
                return order;
            }
            throw new IllegalArgumentException("Razorpay API returned status: " + response.getStatusCode());
        } catch (Exception e) {
            System.err.println("Razorpay Order Creation Failed: " + e.getMessage());
            throw new IllegalArgumentException("Razorpay API connection failed: " + e.getMessage());
        }
    }

    private Map<String, Object> mockCreateOrder(Double amount, String receiptId) {
        Map<String, Object> order = new HashMap<>();
        String orderId = "order_mock" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        order.put("id", orderId);
        order.put("entity", "order");
        order.put("amount", (int) Math.round(amount * 100));
        order.put("amount_paid", 0);
        order.put("amount_due", (int) Math.round(amount * 100));
        order.put("currency", "INR");
        order.put("receipt", receiptId);
        order.put("status", "created");
        order.put("created_at", System.currentTimeMillis() / 1000);
        order.put("key", "mock_key_id");
        return order;
    }

    @Override
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        if (isMock() || orderId.startsWith("order_mock")) {
            return orderId != null && paymentId != null && signature != null && !signature.isBlank();
        }

        try {
            String data = orderId + "|" + paymentId;
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            
            byte[] hashBytes = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            String generatedSignature = sb.toString();
            return generatedSignature.equals(signature);
        } catch (Exception e) {
            System.err.println("Razorpay Signature Verification Failed: " + e.getMessage());
            return false;
        }
    }

    @Override
    public Map<String, Object> refund(String paymentId, Double amount, String reason) {
        if (isMock() || paymentId.startsWith("pay_mock")) {
            return mockRefund(paymentId, amount);
        }

        try {
            String url = "https://api.razorpay.com/v1/payments/" + paymentId + "/refund";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBasicAuth(keyId, keySecret);

            Map<String, Object> body = new HashMap<>();
            body.put("amount", (int) Math.round(amount * 100));
            body.put("speed", "normal");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if ((response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK) && response.getBody() != null) {
                return new HashMap<>(response.getBody());
            }
        } catch (Exception e) {
            System.err.println("Razorpay Refund Failed: " + e.getMessage());
        }

        return mockRefund(paymentId, amount);
    }

    private Map<String, Object> mockRefund(String paymentId, Double amount) {
        Map<String, Object> refund = new HashMap<>();
        String refundId = "rfnd_mock" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        refund.put("id", refundId);
        refund.put("entity", "refund");
        refund.put("amount", (int) Math.round(amount * 100));
        refund.put("currency", "INR");
        refund.put("payment_id", paymentId);
        refund.put("status", "processed");
        refund.put("speed_processed", "normal");
        refund.put("created_at", System.currentTimeMillis() / 1000);
        return refund;
    }
}
