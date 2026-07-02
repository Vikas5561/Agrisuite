package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "dealer_id")
    private Long dealerId;

    @Column(nullable = false, length = 100)
    private String action; // Login, Logout, Failed Login, Password Change, Password Reset, Account Lock, Account Unlock, Session Expired

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(length = 200)
    private String browser;

    @Column(length = 200)
    private String device;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
