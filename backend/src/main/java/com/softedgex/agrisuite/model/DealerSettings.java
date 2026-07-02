package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dealer_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealerSettings {

    @Id
    @Column(name = "dealer_id")
    private Long dealerId;

    @Column(nullable = false, length = 50)
    private String language; // English, Hindi, etc.

    @Column(nullable = false, length = 10)
    private String currency; // INR, etc.

    @Column(nullable = false, length = 100)
    private String timezone; // Asia/Kolkata

    @Column(name = "financial_year", nullable = false, length = 50)
    private String financialYear; // April-March

    @Column(name = "date_format", length = 50)
    private String dateFormat; // dd-MM-yyyy

    @Column(name = "business_hours", length = 200)
    private String businessHours;
}
