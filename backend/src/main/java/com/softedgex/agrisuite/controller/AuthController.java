package com.softedgex.agrisuite.controller;

import com.softedgex.agrisuite.dto.*;
import com.softedgex.agrisuite.service.AuthService;
import com.softedgex.agrisuite.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");
        String browser = getBrowser(userAgent);
        String device = getDevice(userAgent);

        AuthResponse response = authService.login(request, ipAddress, browser, device);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader, HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");
        String browser = getBrowser(userAgent);
        String device = getDevice(userAgent);

        authService.logout(authHeader, ipAddress, browser, device);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Logged out successfully");
        return ResponseEntity.ok(body);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> requestBody, HttpServletRequest servletRequest) {
        String refreshToken = requestBody.get("refreshToken");
        String ipAddress = getClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");
        String browser = getBrowser(userAgent);
        String device = getDevice(userAgent);

        AuthResponse response = authService.refresh(refreshToken, ipAddress, browser, device);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");
        String browser = getBrowser(userAgent);
        String device = getDevice(userAgent);

        authService.forgotPassword(request, ipAddress, browser, device);
        Map<String, String> body = new HashMap<>();
        body.put("message", "OTP sent successfully to registered email");
        return ResponseEntity.ok(body);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        Map<String, String> body = new HashMap<>();
        body.put("message", "OTP verified successfully");
        return ResponseEntity.ok(body);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");
        String browser = getBrowser(userAgent);
        String device = getDevice(userAgent);

        authService.resetPassword(request, ipAddress, browser, device);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Password has been reset successfully");
        return ResponseEntity.ok(body);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request, HttpServletRequest servletRequest) {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        String ipAddress = getClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");
        String browser = getBrowser(userAgent);
        String device = getDevice(userAgent);

        authService.changePassword(username, request, ipAddress, browser, device);
        Map<String, String> body = new HashMap<>();
        body.put("message", "Password has been updated successfully and logged out of other devices");
        return ResponseEntity.ok(body);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    private String getBrowser(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("MSIE") || userAgent.contains("Trident")) return "Internet Explorer";
        if (userAgent.contains("Edge")) return "Edge";
        if (userAgent.contains("Chrome")) return "Chrome";
        if (userAgent.contains("Safari")) return "Safari";
        if (userAgent.contains("Firefox")) return "Firefox";
        return "Unknown";
    }

    private String getDevice(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Android")) return "Android Mobile";
        if (userAgent.contains("iPhone")) return "iPhone";
        if (userAgent.contains("iPad")) return "iPad";
        if (userAgent.contains("Windows")) return "Windows Desktop";
        if (userAgent.contains("Macintosh")) return "Mac Desktop";
        if (userAgent.contains("Linux")) return "Linux Desktop";
        return "Desktop";
    }
}
