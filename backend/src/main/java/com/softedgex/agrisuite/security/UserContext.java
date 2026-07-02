package com.softedgex.agrisuite.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

public class UserContext {

    private static final ThreadLocal<UserSessionInfo> currentInfo = new ThreadLocal<>();

    public static void set(UserSessionInfo info) {
        currentInfo.set(info);
    }

    public static UserSessionInfo get() {
        return currentInfo.get();
    }

    public static void clear() {
        currentInfo.remove();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSessionInfo {
        private Long userId;
        private String username;
        private String email;
        private Long dealerId;
        private String role;
        private List<String> permissions;
    }
}
