package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "visits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dealer_id", nullable = false)
    private Long dealerId;

    @Column(name = "farmer_id", nullable = false)
    private Long farmerId;

    @Column(name = "farmer_name", nullable = false, length = 150)
    private String farmerName;

    @Column(name = "staff_id", nullable = false)
    private Long staffId;

    @Column(name = "staff_name", nullable = false, length = 150)
    private String staffName;

    @Column(name = "visit_type", nullable = false, length = 50)
    private String visitType; // CROP_ADVISORY, SOIL_TEST, COLLECTION, PROMOTIONAL

    @Column(name = "visit_date", nullable = false)
    private LocalDateTime visitDate;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(length = 50)
    private String status; // SCHEDULED, COMPLETED, CANCELLED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (visitDate == null) {
            visitDate = LocalDateTime.now();
        }
        if (status == null) {
            status = "COMPLETED";
        }
    }
}
