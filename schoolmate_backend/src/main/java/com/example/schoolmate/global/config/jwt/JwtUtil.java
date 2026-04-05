package com.example.schoolmate.global.config.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long accessTokenExpiry;
    private final long refreshTokenExpiry;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiry:1800000}") long accessTokenExpiry,
            @Value("${jwt.refresh-token-expiry:604800000}") long refreshTokenExpiry) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
    }

    /**
     * @param infoId 현재 활성 역할 인스턴스 ID (StudentInfo.id / TeacherInfo.id 등)
     */
    public String generateAccessToken(Long uid, String email, String role, Long schoolId, Long infoId) {
        JwtBuilder builder = Jwts.builder()
                .subject(email)
                .claim("uid", uid)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiry));
        if (schoolId != null) builder.claim("schoolId", schoolId);
        if (infoId  != null) builder.claim("infoId",   infoId);
        return builder.signWith(key).compact();
    }

    /**
     * Refresh Token에도 uid·role·infoId를 포함해 컨텍스트를 유지합니다.
     */
    public String generateRefreshToken(String email, Long uid, String role, Long infoId) {
        JwtBuilder builder = Jwts.builder()
                .subject(email)
                .claim("uid",  uid)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiry));
        if (infoId != null) builder.claim("infoId", infoId);
        return builder.signWith(key).compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getEmail(String token) {
        return parseToken(token).getSubject();
    }

    public String getRole(String token) {
        return parseToken(token).get("role", String.class);
    }

    public Long getUid(String token) {
        return parseToken(token).get("uid", Long.class);
    }

    public Long getSchoolId(String token) {
        return parseToken(token).get("schoolId", Long.class);
    }

    public Long getInfoId(String token) {
        return parseToken(token).get("infoId", Long.class);
    }

    public long getRefreshTokenExpiry() {
        return refreshTokenExpiry;
    }
}
