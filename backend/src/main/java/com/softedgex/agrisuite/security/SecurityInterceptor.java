package com.softedgex.agrisuite.security;

import com.softedgex.agrisuite.util.JwtUtils;
import com.softedgex.agrisuite.repository.UserSessionRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import java.nio.file.AccessDeniedException;
import java.util.Arrays;
import java.util.List;

@Component
public class SecurityInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Skip CORS pre-flight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        
        // Skip public paths
        if (path.startsWith("/api/v1/auth") || path.startsWith("/h2-console") || path.startsWith("/api/v1/payments/webhook") || path.startsWith("/api/v1/payments/config-check")) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Authorization token is missing\"}");
            return false;
        }

        String token = authHeader.substring(7);
        if (!jwtUtils.validateJwtToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Authorization token is invalid or expired\"}");
            return false;
        }

        Claims claims = jwtUtils.getClaimsFromToken(token);
        String sessionId = claims.get("sessionId", String.class);
        if (sessionId != null) {
            java.util.Optional<com.softedgex.agrisuite.model.UserSession> sessionOpt = userSessionRepository.findById(sessionId);
            if (sessionOpt.isEmpty() || !"ACTIVE".equalsIgnoreCase(sessionOpt.get().getStatus())) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Session has been terminated by administrator.\"}");
                return false;
            }
        }

        String username = claims.getSubject();
        Long dealerId = claims.get("dealerId", Long.class);
        String role = claims.get("role", String.class);
        String permissionsStr = claims.get("permissions", String.class);
        List<String> permissions = permissionsStr != null && !permissionsStr.isBlank()
                ? Arrays.asList(permissionsStr.split(","))
                : List.of();
        Long userId = claims.get("userId", Long.class);
        String department = claims.get("department", String.class);
        String designation = claims.get("designation", String.class);

        UserContext.UserSessionInfo sessionInfo = UserContext.UserSessionInfo.builder()
                .userId(userId)
                .username(username)
                .email(null)
                .dealerId(dealerId)
                .role(role)
                .permissions(permissions)
                .department(department)
                .designation(designation)
                .build();

        UserContext.set(sessionInfo);

        // Role & Department / Designation checks
        if ("STAFF".equalsIgnoreCase(role)) {
            String dept = (department != null ? department : "").toUpperCase();
            String desig = (designation != null ? designation : "").toUpperCase();
            
            boolean isInventoryManager = dept.contains("INVENTORY") || desig.contains("INVENTORY");
            boolean isSalesOrCashier = dept.contains("SALES") || dept.contains("ACCOUNTS") || desig.contains("CASHIER") || desig.contains("SALES") || desig.contains("ACCOUNTANT");
            boolean isField = dept.contains("FIELD") || desig.contains("FIELD") || desig.contains("AGRONOMIST");

            // 1. Administration modules are blocked for all staff
            if (path.startsWith("/api/v1/staff") || path.startsWith("/api/v1/dealers") || path.startsWith("/api/v1/admin") || path.startsWith("/api/v1/subscriptions")) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied. Administration access is restricted to dealers and admins only.\"}");
                return false;
            }

            // 2. Module specific checks
            if (isInventoryManager) {
                // Inventory Manager should ONLY access: Products, Suppliers, Purchase Entries
                // Block access to: Visits, Farmers, Credit Book, Sales
                if (path.startsWith("/api/v1/visits") || path.startsWith("/api/v1/farmers") || path.startsWith("/api/v1/sales") || path.startsWith("/api/v1/credit")) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied. Inventory Managers only have access to products, inventory, and supplier purchases.\"}");
                    return false;
                }
            } else if (isSalesOrCashier) {
                // Cashier/Sales should NOT access: Products, Suppliers, Purchase Entries, Visits
                if (path.startsWith("/api/v1/products") || path.startsWith("/api/v1/suppliers") || path.startsWith("/api/v1/purchases") || path.startsWith("/api/v1/visits")) {
                    // Allow GET /api/v1/products (read only) but block POST/PUT/DELETE for products!
                    if (path.startsWith("/api/v1/products") && !"GET".equalsIgnoreCase(request.getMethod())) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied. Cashiers and sales staff cannot modify products or inventory.\"}");
                        return false;
                    }
                    if (path.startsWith("/api/v1/suppliers") || path.startsWith("/api/v1/purchases") || path.startsWith("/api/v1/visits")) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied. Cashiers and sales staff do not have access to suppliers, purchase logs, or field visits.\"}");
                        return false;
                    }
                }
            } else if (isField) {
                // Field agents should ONLY access: Farmers, Visits
                // Block access to: Products, Suppliers, Purchase Entries, Credit Book, Sales
                if (path.startsWith("/api/v1/products") || path.startsWith("/api/v1/suppliers") || path.startsWith("/api/v1/purchases") || path.startsWith("/api/v1/sales") || path.startsWith("/api/v1/credit")) {
                    if (path.startsWith("/api/v1/products") && !"GET".equalsIgnoreCase(request.getMethod())) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied. Field agents cannot modify products or inventory.\"}");
                        return false;
                    }
                    if (path.startsWith("/api/v1/suppliers") || path.startsWith("/api/v1/purchases") || path.startsWith("/api/v1/sales") || path.startsWith("/api/v1/credit")) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied. Field agents only have access to farmers and field visits tracker.\"}");
                        return false;
                    }
                }
            } else {
                // General fallback: restrict everything except baseline read access
                if (path.startsWith("/api/v1/staff") || path.startsWith("/api/v1/dealers") || path.startsWith("/api/v1/suppliers") || path.startsWith("/api/v1/purchases") || path.startsWith("/api/v1/sales") || path.startsWith("/api/v1/credit") || path.startsWith("/api/v1/visits")) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied. General staff roles have restricted module permissions.\"}");
                    return false;
                }
            }
        }

        // Role-Based Authorization check
        if (handler instanceof HandlerMethod) {
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
            if (requireRole == null) {
                requireRole = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
            }

            if (requireRole != null) {
                List<String> allowedRoles = Arrays.asList(requireRole.value());
                if (!allowedRoles.contains(role)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied. Insufficient role permissions.\"}");
                    return false;
                }
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserContext.clear();
    }
}
