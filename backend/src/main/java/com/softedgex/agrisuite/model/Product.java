package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dealer_id", nullable = false)
    private Long dealerId;

    @Column(name = "product_code", unique = true, nullable = false, length = 50)
    private String productCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String brand;

    @Column(nullable = false, length = 100)
    private String category; // Fertilizers, Seeds, Pesticides, Insecticides, etc.

    @Column(name = "product_type", length = 50)
    private String productType;

    @Column(nullable = false, length = 50)
    private String unit; // Bag, Bottle, Packet, Kg, Litre, etc.

    @Column(nullable = false)
    private Double stock;

    @Column(name = "minimum_stock")
    private Double minimumStock;

    @Column(name = "maximum_stock")
    private Double maximumStock;

    @Column(name = "reorder_level")
    private Double reorderLevel;

    @Column(name = "purchase_price", nullable = false)
    private Double purchasePrice;

    @Column(name = "selling_price", nullable = false)
    private Double sellingPrice;

    @Column(name = "mrp")
    private Double mrp;

    @Column(name = "gst_percentage", nullable = false)
    private Double gstPercentage;

    @Column(name = "discount_allowed")
    @Builder.Default
    private Boolean discountAllowed = true;

    @Column(nullable = false, length = 30)
    private String status; // ACTIVE, INACTIVE, DISCONTINUED, OUT_OF_STOCK, EXPIRED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (discountAllowed == null) {
            discountAllowed = true;
        }
        if (status == null) {
            status = "ACTIVE";
        }
    }
}
