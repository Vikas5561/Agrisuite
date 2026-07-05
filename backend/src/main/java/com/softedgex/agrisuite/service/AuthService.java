package com.softedgex.agrisuite.service;

import com.softedgex.agrisuite.dto.*;
import com.softedgex.agrisuite.exception.BadCredentialsException;
import com.softedgex.agrisuite.exception.LockedException;
import com.softedgex.agrisuite.exception.UsernameNotFoundException;
import com.softedgex.agrisuite.model.*;
import com.softedgex.agrisuite.repository.*;
import com.softedgex.agrisuite.util.JwtUtils;
import com.softedgex.agrisuite.util.PasswordUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private LoginAuditLogRepository auditLogRepository;

    @Autowired
    private PasswordUtils passwordUtils;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private TwilioService twilioService;

    private String resolveDisplayName(User user, String roleName) {
        if ("SUPER_ADMIN".equalsIgnoreCase(roleName)) {
            return "Super Admin";
        } else if ("DEALER_ADMIN".equalsIgnoreCase(roleName)) {
            if (user.getDealerId() != null) {
                return dealerRepository.findById(user.getDealerId())
                        .map(Dealer::getOwnerName)
                        .orElse(user.getUsername());
            }
        } else if ("STAFF".equalsIgnoreCase(roleName)) {
            if (staffRepository != null && user.getId() != null) {
                return staffRepository.findByUserId(user.getId())
                        .map(s -> s.getFirstName() + " " + s.getLastName())
                        .orElse(user.getUsername());
            }
        }
        return user.getUsername();
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String browser, String device) {
        String usernameOrEmail = request.getUsername();
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(usernameOrEmail)
                .or(() -> userRepository.findByEmailIgnoreCase(usernameOrEmail));

        if (userOpt.isEmpty()) {
            throw new BadCredentialsException("Invalid credentials");
        }

        User user = userOpt.get();

        // 1. Check if user is locked, and if lock duration has expired
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            if (user.getLockTime() != null && user.getLockTime().plusMinutes(30).isBefore(LocalDateTime.now())) {
                user.setStatus("ACTIVE");
                user.setFailedAttempts(0);
                user.setLockTime(null);
                userRepository.save(user);
                createAuditLog(user.getId(), user.getDealerId(), "Account Unlock", ipAddress, browser, device);
            } else {
                createAuditLog(user.getId(), user.getDealerId(), "Failed Login (Locked)", ipAddress, browser, device);
                throw new LockedException("Account is locked due to multiple failed attempts. Try again in 30 minutes.");
            }
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new BadCredentialsException("Account is inactive or suspended");
        }

        // Verify password
        if (!passwordUtils.matches(request.getPassword(), user.getPassword())) {
            // Increment failed attempts
            int attempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(attempts);
            createAuditLog(user.getId(), user.getDealerId(), "Failed Login", ipAddress, browser, device);

            if (attempts >= 5) {
                user.setStatus("LOCKED");
                user.setLockTime(LocalDateTime.now());
                createAuditLog(user.getId(), user.getDealerId(), "Account Lock", ipAddress, browser, device);
                userRepository.save(user);
                throw new LockedException("Account locked. 5 failed login attempts. Try again in 30 minutes.");
            }
            userRepository.save(user);
            throw new BadCredentialsException("Invalid username or password");
        }

        // Reset failed attempts on success
        user.setFailedAttempts(0);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Fetch user permissions for JWT
        List<String> permissions = new ArrayList<>();
        if (user.getRole() != null) {
            user.getRole().getPermissions().forEach(permission -> {
                permissions.add(permission.getPermissionName());
            });
        }
        String permissionsStr = String.join(",", permissions);

        // Generate tokens
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "STAFF";
        String sessionId = UUID.randomUUID().toString();

        String department = null;
        String designation = null;
        if ("STAFF".equalsIgnoreCase(roleName)) {
            Optional<Staff> staffOpt = staffRepository.findByUserId(user.getId());
            if (staffOpt.isPresent()) {
                department = staffOpt.get().getDepartment();
                designation = staffOpt.get().getDesignation();
            }
        }

        String token = jwtUtils.generateAccessToken(user.getUsername(), user.getDealerId(), roleName, permissionsStr, sessionId, user.getId(), department, designation);
        String refreshToken = jwtUtils.generateRefreshToken(user.getUsername());

        // Track user session
        UserSession session = UserSession.builder()
                .sessionId(sessionId)
                .userId(user.getId())
                .refreshToken(refreshToken)
                .ipAddress(ipAddress)
                .device(device)
                .browser(browser)
                .loginTime(LocalDateTime.now())
                .lastActivity(LocalDateTime.now())
                .status("ACTIVE")
                .build();
        userSessionRepository.save(session);

        createAuditLog(user.getId(), user.getDealerId(), "Login", ipAddress, browser, device);

        String businessName = null;
        String logoUrl = null;
        if (user.getDealerId() != null) {
            Optional<Dealer> d = dealerRepository.findById(user.getDealerId());
            if (d.isPresent()) {
                businessName = d.get().getBusinessName();
                logoUrl = d.get().getLogoUrl();
            }
        }

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(roleName)
                .dealerId(user.getDealerId())
                .businessName(businessName)
                .logoUrl(logoUrl)
                .displayName(resolveDisplayName(user, roleName))
                .permissions(permissions)
                .status("SUCCESS")
                .department(department)
                .designation(designation)
                .build();
    }

    @Transactional
    public void logout(String authHeader, String ipAddress, String browser, String device) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtils.validateJwtToken(token)) {
                String username = jwtUtils.getUsernameFromJwtToken(token);
                Optional<User> userOpt = userRepository.findByUsername(username);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    // Invalidate sessions for this user
                    List<UserSession> activeSessions = userSessionRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");
                    for (UserSession session : activeSessions) {
                        session.setStatus("LOGGED_OUT");
                        session.setLogoutTime(LocalDateTime.now());
                        userSessionRepository.save(session);
                    }
                    createAuditLog(user.getId(), user.getDealerId(), "Logout", ipAddress, browser, device);
                }
            }
        }
    }

    @Transactional
    public AuthResponse refresh(String refreshToken, String ipAddress, String browser, String device) {
        if (refreshToken == null || !jwtUtils.validateJwtToken(refreshToken)) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        Optional<UserSession> sessionOpt = userSessionRepository.findByRefreshToken(refreshToken);
        if (sessionOpt.isEmpty() || !"ACTIVE".equalsIgnoreCase(sessionOpt.get().getStatus())) {
            throw new BadCredentialsException("Session is invalid or logged out");
        }

        UserSession session = sessionOpt.get();
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new BadCredentialsException("User account is not active");
        }

        // Generate new Access and Refresh tokens
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "STAFF";
        List<String> permissions = new ArrayList<>();
        if (user.getRole() != null) {
            user.getRole().getPermissions().forEach(permission -> {
                permissions.add(permission.getPermissionName());
            });
        }
        String permissionsStr = String.join(",", permissions);

        String department = null;
        String designation = null;
        if ("STAFF".equalsIgnoreCase(roleName)) {
            Optional<Staff> staffOpt = staffRepository.findByUserId(user.getId());
            if (staffOpt.isPresent()) {
                department = staffOpt.get().getDepartment();
                designation = staffOpt.get().getDesignation();
            }
        }

        String newAccessToken = jwtUtils.generateAccessToken(user.getUsername(), user.getDealerId(), roleName, permissionsStr, session.getSessionId(), user.getId(), department, designation);
        String newRefreshToken = jwtUtils.generateRefreshToken(user.getUsername());

        // Rotate Refresh Token
        session.setRefreshToken(newRefreshToken);
        session.setLastActivity(LocalDateTime.now());
        userSessionRepository.save(session);

        String businessName = null;
        String logoUrl = null;
        if (user.getDealerId() != null) {
            Optional<Dealer> d = dealerRepository.findById(user.getDealerId());
            if (d.isPresent()) {
                businessName = d.get().getBusinessName();
                logoUrl = d.get().getLogoUrl();
            }
        }



        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(roleName)
                .dealerId(user.getDealerId())
                .businessName(businessName)
                .logoUrl(logoUrl)
                .displayName(resolveDisplayName(user, roleName))
                .permissions(permissions)
                .status("SUCCESS")
                .department(department)
                .designation(designation)
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String ipAddress, String browser, String device) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + request.getEmail()));

        // Generate 6 Digit OTP
        Random random = new Random();
        String otp = String.format("%06d", random.nextInt(1000000));

        PasswordResetToken token = PasswordResetToken.builder()
                .userId(user.getId())
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(10)) // Valid for 10 minutes
                .attempts(0)
                .build();

        passwordResetTokenRepository.save(token);

        // Send OTP via SMS
        if (user.getMobile() != null && !user.getMobile().trim().isEmpty()) {
            String otpMessage = "Your SoftEdgeX AgriSuite security OTP code is: " + otp + ". This code is valid for 10 minutes.";
            twilioService.sendSms(user.getMobile(), otpMessage);
        }

        // Print OTP for verification
        System.out.println("----------------------------------------------");
        System.out.println("OTP FOR USER " + user.getUsername() + ": " + otp);
        System.out.println("----------------------------------------------");

        try {
            java.nio.file.Files.writeString(
                java.nio.file.Paths.get("forgot_password_otp.txt"),
                "OTP FOR USER " + user.getUsername() + " (" + user.getEmail() + "): " + otp + "\nGenerated at: " + java.time.LocalDateTime.now()
            );
        } catch (Exception e) {
            System.err.println("Could not write OTP to file: " + e.getMessage());
        }

        createAuditLog(user.getId(), user.getDealerId(), "Password Reset Requested", ipAddress, browser, device);
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + request.getEmail()));

        PasswordResetToken resetToken = passwordResetTokenRepository.findById(user.getId())
                .orElseThrow(() -> new BadCredentialsException("No OTP requested for this account"));

        if (resetToken.getExpiryTime().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BadCredentialsException("OTP has expired");
        }

        if (resetToken.getAttempts() >= 5) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BadCredentialsException("Maximum OTP verification attempts exceeded");
        }

        if (!resetToken.getOtp().equals(request.getOtp())) {
            resetToken.setAttempts(resetToken.getAttempts() + 1);
            passwordResetTokenRepository.save(resetToken);
            throw new BadCredentialsException("Invalid OTP code");
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ipAddress, String browser, String device) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + request.getEmail()));

        PasswordResetToken resetToken = passwordResetTokenRepository.findById(user.getId())
                .orElseThrow(() -> new BadCredentialsException("Invalid or missing reset token"));

        if (!resetToken.getOtp().equals(request.getOtp()) || resetToken.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Invalid or expired OTP");
        }

        // Encrypt new password
        user.setPassword(passwordUtils.encode(request.getNewPassword()));
        user.setFailedAttempts(0);
        user.setStatus("ACTIVE");
        user.setLockTime(null);
        userRepository.save(user);

        // Delete reset token
        passwordResetTokenRepository.delete(resetToken);

        // Invalidate all active sessions
        List<UserSession> activeSessions = userSessionRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");
        for (UserSession session : activeSessions) {
            session.setStatus("LOGGED_OUT");
            session.setLogoutTime(LocalDateTime.now());
            userSessionRepository.save(session);
        }

        createAuditLog(user.getId(), user.getDealerId(), "Password Reset Successful", ipAddress, browser, device);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request, String ipAddress, String browser, String device) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New passwords do not match");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!passwordUtils.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password does not match");
        }

        if (passwordUtils.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as the current password");
        }

        user.setPassword(passwordUtils.encode(request.getNewPassword()));
        userRepository.save(user);

        // Log out of all sessions after password change
        List<UserSession> activeSessions = userSessionRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");
        for (UserSession session : activeSessions) {
            session.setStatus("LOGGED_OUT");
            session.setLogoutTime(LocalDateTime.now());
            userSessionRepository.save(session);
        }

        createAuditLog(user.getId(), user.getDealerId(), "Password Change", ipAddress, browser, device);
    }

    private void createAuditLog(Long userId, Long dealerId, String action, String ipAddress, String browser, String device) {
        LoginAuditLog log = LoginAuditLog.builder()
                .userId(userId)
                .dealerId(dealerId)
                .action(action)
                .ipAddress(ipAddress)
                .browser(browser)
                .device(device)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }
}
