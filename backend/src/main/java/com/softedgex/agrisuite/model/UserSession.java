package com.softedgex.agrisuite.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {

    @Id
    @Column(name = "session_id", length = 100)
    private String sessionId; // UUID

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "refresh_token", length = 500, unique = true)
    private String refreshToken;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(length = 200)
    private String device;

    @Column(length = 200)
    private String browser;

    @Column(name = "login_time", nullable = false)
    private LocalDateTime loginTime;

    @Column(name = "last_activity")
    private LocalDateTime lastActivity;

    @Column(name = "logout_time")
    private LocalDateTime logoutTime;

    @Column(nullable = false, length = 30)
    private String status; // ACTIVE, LOGGED_OUT, EXPIRED
}
