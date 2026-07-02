package com.softedgex.agrisuite.security;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireRole {
    String[] value(); // e.g. "SUPER_ADMIN", "DEALER_ADMIN", "STAFF"
}
