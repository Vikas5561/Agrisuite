package com.softedgex.agrisuite.util;

import com.softedgex.agrisuite.security.UserContext;

public class SecurityUtils {

    public static Long getCurrentDealerId() {
        UserContext.UserSessionInfo info = UserContext.get();
        return info != null ? info.getDealerId() : null;
    }

    public static String getCurrentUsername() {
        UserContext.UserSessionInfo info = UserContext.get();
        return info != null ? info.getUsername() : null;
    }

    public static boolean isSuperAdmin() {
        UserContext.UserSessionInfo info = UserContext.get();
        return info != null && "SUPER_ADMIN".equalsIgnoreCase(info.getRole());
    }
}
