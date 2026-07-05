package com.softedgex.agrisuite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long userId;
    private String username;
    private String email;
    private String role;
    private Long dealerId;
    private String businessName;
    private String logoUrl;
    private String displayName;
    private List<String> permissions;
    private String status;
    private String department;
    private String designation;
}
