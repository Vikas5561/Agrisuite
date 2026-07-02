package com.softedgex.agrisuite.dto;

import lombok.Data;
import java.util.List;

@Data
public class SalesInvoiceRequest {
    private Long farmerId;
    private String paymentMethod;
    private Double amountPaid;
    private List<SalesItem> items;

    @Data
    public static class SalesItem {
        private Long productId;
        private String productName;
        private String brand;
        private Double quantity;
        private String unit;
        private Double sellingPrice;
        private Double gstPercentage;
        private Double subtotal;
        private Double gstAmount;
        private Double total;
    }
}
