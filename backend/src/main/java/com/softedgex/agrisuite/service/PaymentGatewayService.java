package com.softedgex.agrisuite.service;

import java.util.Map;

public interface PaymentGatewayService {
    Map<String, Object> createOrder(Long dealerId, Double amount, String receiptId);
    boolean verifySignature(String orderId, String paymentId, String signature);
    Map<String, Object> refund(String paymentId, Double amount, String reason);
}
