package com.ftp.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal in-memory fixed window rate limiter for the authentication
 * endpoints. It blunts online password guessing without adding an external
 * dependency.
 *
 * <p>For a multi instance deployment this should be replaced by a shared
 * counter (Redis) so limits are enforced across nodes.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_WINDOW = 10;
    private static final long WINDOW_MILLIS = 60_000L;
    private static final String AUTH_PREFIX = "/api/auth/";

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(AUTH_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String clientKey = resolveClientKey(request);
        Window window = windows.compute(clientKey, (key, existing) -> {
            long now = System.currentTimeMillis();
            if (existing == null || now - existing.start >= WINDOW_MILLIS) {
                return new Window(now);
            }
            existing.count++;
            return existing;
        });

        if (window.count > MAX_REQUESTS_PER_WINDOW) {
            long retryAfterSeconds = Math.max(1, (WINDOW_MILLIS - (System.currentTimeMillis() - window.start)) / 1000);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\","
                            + "\"message\":\"Too many authentication attempts. Please try again later.\"}");
            return;
        }

        // Opportunistically evict stale windows to keep the map bounded.
        if (windows.size() > 10_000) {
            long now = System.currentTimeMillis();
            windows.entrySet().removeIf(entry -> now - entry.getValue().start >= WINDOW_MILLIS);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class Window {
        private final long start;
        private int count = 1;

        private Window(long start) {
            this.start = start;
        }
    }
}
