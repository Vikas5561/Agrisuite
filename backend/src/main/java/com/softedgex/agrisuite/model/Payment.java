package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dealer_id", nullable = false)
    private Long dealerId;

    @Column(name = "subscription_id")
    private Long subscriptionId;

    @Column(name = "order_id", length = 100)
    private String orderId;

    @Column(name = "payment_id", length = 100)
    private String paymentId;

    @Column(length = 50)
    private String gateway; // Razorpay, Cashfree, etc.

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private Double gst;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(nullable = false, length = 30)
    private String status; // PENDING, SUCCESS, FAILED, CANCELLED, REFUNDED, PROCESSING

    @Column(name = "payment_method", length = 50)
    private String paymentMethod; // UPI, Credit Card, Debit Card, Net Banking, Wallet

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
