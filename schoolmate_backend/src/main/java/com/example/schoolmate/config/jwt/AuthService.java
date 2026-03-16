package com.example.schoolmate.config.jwt;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.StaffInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
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
    private final UserRepository userRepository;

    public AuthService(JwtUtil jwtUtil,
                       RefreshTokenRepository refreshTokenRepository,
                       @Lazy AuthenticationManager authenticationManager,
                       UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
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

        User user = userRepository.findById(uid).orElse(null);
        Long schoolId = extractSchoolId(user, primaryRole);

        String accessToken = jwtUtil.generateAccessToken(uid, email, role, schoolId);
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

        User user = userRepository.findByEmail(email).orElse(null);
        UserRole userRole = role != null ? UserRole.valueOf(role) : null;
        Long schoolId = extractSchoolId(user, userRole);

        // 새 AccessToken + RefreshToken 재발급 (Rotation)
        String newAccessToken = jwtUtil.generateAccessToken(uid, email, role, schoolId);
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
        User user = userRepository.findById(uid).orElse(null);
        UserRole userRole = role != null && !role.equals("GUEST") ? UserRole.valueOf(role) : null;
        Long schoolId = extractSchoolId(user, userRole);
        String accessToken = jwtUtil.generateAccessToken(uid, email, role, schoolId);
        String refreshToken = jwtUtil.generateRefreshToken(email);
        saveRefreshToken(email, refreshToken);
        return Map.of("accessToken", accessToken, "refreshToken", refreshToken);
    }

    /**
     * 유저의 소속 학교 ID 추출 (TEACHER, STUDENT, STAFF만 학교 소속)
     * ADMIN은 X-School-Id 헤더로 학교를 선택하므로 null 반환
     * PARENT는 학교 소속 없으므로 null 반환
     */
    private Long extractSchoolId(User user, UserRole role) {
        if (user == null || role == null) return null;
        return switch (role) {
            case TEACHER -> {
                TeacherInfo info = user.getInfo(TeacherInfo.class);
                yield (info != null && info.getSchool() != null) ? info.getSchool().getId() : null;
            }
            case STUDENT -> {
                StudentInfo info = user.getInfo(StudentInfo.class);
                yield (info != null && info.getSchool() != null) ? info.getSchool().getId() : null;
            }
            case STAFF -> {
                StaffInfo info = user.getInfo(StaffInfo.class);
                yield (info != null && info.getSchool() != null) ? info.getSchool().getId() : null;
            }
            default -> null;
        };
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
