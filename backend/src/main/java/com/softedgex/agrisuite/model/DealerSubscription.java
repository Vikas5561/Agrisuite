package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dealer_subscriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealerSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dealer_id", nullable = false)
    private Long dealerId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "grace_end_date")
    private LocalDateTime graceEndDate;

    @Column(nullable = false, length = 30)
    private String status; // ACTIVE, PENDING, EXPIRED, SUSPENDED, CANCELLED, TRIAL

    @Column(name = "auto_renew")
    @Builder.Default
    private Boolean autoRenew = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (autoRenew == null) {
            autoRenew = false;
        }
    }
}
