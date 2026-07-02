package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "farmers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Farmer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dealer_id", nullable = false)
    private Long dealerId;

    @Column(name = "farmer_code", unique = true, nullable = false, length = 50)
    private String farmerCode;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false, length = 20)
    private String mobile;

    @Column(name = "alternate_mobile", length = 20)
    private String alternateMobile;

    @Column(length = 20)
    private String aadhaar;

    @Column(length = 10)
    private String gender;

    @Column(nullable = false, length = 100)
    private String village;

    @Column(length = 100)
    private String taluka;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String state;

    @Column(name = "pin_code", length = 10)
    private String pinCode;

    @Column(name = "farm_size")
    private Double farmSize;

    @Column(name = "farm_unit", length = 20) // Acre, Hectare
    private String farmUnit;

    @Column(name = "soil_type", length = 50)
    private String soilType;

    @Column(name = "irrigation_type", length = 50)
    private String irrigationType;

    @Column(name = "primary_crop", length = 100)
    private String primaryCrop;

    @Column(name = "secondary_crop", length = 100)
    private String secondaryCrop;

    @Column(name = "preferred_language", length = 50)
    private String preferredLanguage;

    @Column(name = "payment_preference", length = 50) // Cash, UPI, Credit
    private String paymentPreference;

    @Column(name = "credit_limit")
    private Double creditLimit;

    @Column(name = "outstanding_credit")
    @Builder.Default
    private Double outstandingCredit = 0.0;

    @Column(nullable = false, length = 30)
    private String status; // ACTIVE, INACTIVE, BLOCKED, DECEASED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (outstandingCredit == null) {
            outstandingCredit = 0.0;
        }
        if (status == null) {
            status = "ACTIVE";
        }
    }
}
