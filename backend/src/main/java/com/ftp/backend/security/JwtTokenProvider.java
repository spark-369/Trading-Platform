package com.ftp.backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long jwtExpirationMs;

    public JwtTokenProvider(@Value("${jwt.secret}") String jwtSecret,
                            @Value("${jwt.expiration}") long jwtExpirationMs) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "JWT secret is not configured. Set the JWT_SECRET environment variable "
                            + "(a base64 encoded key of at least 32 bytes).");
        }
        byte[] decoded;
        try {
            decoded = Decoders.BASE64.decode(jwtSecret);
        } catch (Exception ex) {
            throw new IllegalStateException("JWT secret must be a valid base64 encoded value", ex);
        }
        if (decoded.length < 32) {
            throw new IllegalStateException(
                    "JWT secret must decode to at least 32 bytes for HMAC-SHA256 signatures");
        }
        this.key = Keys.hmacShaKeyFor(decoded);
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public String generateToken(String username, List<? extends GrantedAuthority> authorities) {
        List<String> roles = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(username)
                .claim("roles", roles)
                .issuedAt(new java.util.Date())
                .expiration(new java.util.Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public List<String> getRolesFromToken(String token) {
        List<?> raw = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("roles", List.class);
        return raw.stream()
                .map(Object::toString)
                .collect(Collectors.toList());
    }
}
