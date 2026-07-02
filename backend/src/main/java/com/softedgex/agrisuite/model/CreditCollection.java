package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_collections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dealer_id", nullable = false)
    private Long dealerId;

    @Column(name = "farmer_id", nullable = false)
    private Long farmerId;

    @Column(name = "farmer_name", nullable = false, length = 150)
    private String farmerName;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "payment_mode", nullable = false, length = 50)
    private String paymentMode; // CASH, UPI

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "collected_by", length = 100)
    private String collectedBy;

    @Column(name = "collected_at", updatable = false)
    private LocalDateTime collectedAt;

    @PrePersist
    protected void onCreate() {
        collectedAt = LocalDateTime.now();
    }
}
