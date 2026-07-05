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

        UserContext.UserSessionInfo sessionInfo = UserContext.UserSessionInfo.builder()
                .userId(null) // Can look up if needed, but not required for simple request context
                .username(username)
                .email(null)
                .dealerId(dealerId)
                .role(role)
                .permissions(permissions)
                .build();

        UserContext.set(sessionInfo);

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
