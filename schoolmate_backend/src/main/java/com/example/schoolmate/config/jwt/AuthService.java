package com.example.schoolmate.config.jwt;

import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.dto.AuthUserDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@Slf4j
public class AuthService {

    private final JwtUtil jwtUtil;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;

    public AuthService(JwtUtil jwtUtil,
                       RefreshTokenRepository refreshTokenRepository,
                       @Lazy AuthenticationManager authenticationManager) {
        this.jwtUtil = jwtUtil;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authenticationManager = authenticationManager;
    }

    /**
     * 이메일/비밀번호로 로그인 → AccessToken + RefreshToken 발급
     */
    @Transactional
    public Map<String, Object> login(String email, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        AuthUserDTO userDTO = (AuthUserDTO) authentication.getPrincipal();
        UserRole primaryRole = userDTO.getPrimaryRole();
        String role = primaryRole != null ? primaryRole.name() : "GUEST";
        Long uid = userDTO.getCustomUserDTO().getUid();

        String accessToken = jwtUtil.generateAccessToken(uid, email, role);
        String refreshToken = jwtUtil.generateRefreshToken(email);

        saveRefreshToken(email, refreshToken);

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "role", role,
                "email", email,
                "name", userDTO.getCustomUserDTO().getName()
        );
    }

    /**
     * RefreshToken으로 새 AccessToken 발급
     */
    @Transactional
    public Map<String, String> refresh(String refreshToken) {
        if (!jwtUtil.isValid(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 Refresh Token입니다.");
        }

        String email = jwtUtil.getEmail(refreshToken);

        RefreshToken saved = refreshTokenRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("저장된 Refresh Token이 없습니다."));

        if (!saved.getToken().equals(refreshToken) || saved.isExpired()) {
            throw new IllegalArgumentException("만료되었거나 일치하지 않는 Refresh Token입니다.");
        }

        String role = jwtUtil.getRole(refreshToken);
        Long uid = jwtUtil.getUid(refreshToken);

        // 새 AccessToken + RefreshToken 재발급 (Rotation)
        String newAccessToken = jwtUtil.generateAccessToken(uid, email, role);
        String newRefreshToken = jwtUtil.generateRefreshToken(email);
        saveRefreshToken(email, newRefreshToken);

        return Map.of(
                "accessToken", newAccessToken,
                "refreshToken", newRefreshToken
        );
    }

    /**
     * 로그아웃 - DB에서 RefreshToken 삭제
     */
    @Transactional
    public void logout(String email) {
        refreshTokenRepository.deleteByEmail(email);
        log.info("로그아웃 완료: {}", email);
    }

    /**
     * OAuth2 로그인 성공 후 JWT 발급 (소셜 로그인용)
     */
    @Transactional
    public Map<String, String> issueTokensForOAuth2(Long uid, String email, String role) {
        String accessToken = jwtUtil.generateAccessToken(uid, email, role);
        String refreshToken = jwtUtil.generateRefreshToken(email);
        saveRefreshToken(email, refreshToken);
        return Map.of("accessToken", accessToken, "refreshToken", refreshToken);
    }

    private void saveRefreshToken(String email, String refreshToken) {
        LocalDateTime expiresAt = LocalDateTime.now()
                .plusSeconds(jwtUtil.getRefreshTokenExpiry() / 1000);

        refreshTokenRepository.findByEmail(email).ifPresentOrElse(
                existing -> existing.updateToken(refreshToken, expiresAt),
                () -> refreshTokenRepository.save(RefreshToken.builder()
                        .email(email)
                        .token(refreshToken)
                        .expiresAt(expiresAt)
                        .build())
        );
    }
}
