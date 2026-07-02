package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name; // Starter, Standard, Professional, Enterprise

    @Column(name = "duration_months", nullable = false)
    private Integer durationMonths;

    @Column(nullable = false)
    private Double price;

    @Column(name = "max_staff")
    private Integer maxStaff;

    @Column(name = "max_storage")
    private Integer maxStorage; // In MB

    @Column(name = "max_documents")
    private Integer maxDocuments;

    @Column(nullable = false, length = 30)
    private String status; // ACTIVE, INACTIVE

    @Column(name = "offer_discount")
    private Double offerDiscount; // Discount amount in absolute value

    @Column(name = "offer_code", length = 50)
    private String offerCode; // Discount code (e.g. MONSOON20)

    @Column(name = "offer_description", length = 255)
    private String offerDescription; // Banner details shown to dealer

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "ACTIVE";
        }
    }
}
