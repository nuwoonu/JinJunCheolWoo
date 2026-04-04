package com.example.schoolmate.global.config.jwt;

import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.staff.entity.StaffInfo;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.global.entity.SchoolMemberInfo;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.UserRole;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.domain.staff.repository.StaffInfoRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AuthService {

    private final JwtUtil jwtUtil;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StaffInfoRepository staffInfoRepository;

    public AuthService(JwtUtil jwtUtil,
                       RefreshTokenRepository refreshTokenRepository,
                       @Lazy AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       StudentInfoRepository studentInfoRepository,
                       TeacherInfoRepository teacherInfoRepository,
                       StaffInfoRepository staffInfoRepository) {
        this.jwtUtil = jwtUtil;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.studentInfoRepository = studentInfoRepository;
        this.teacherInfoRepository = teacherInfoRepository;
        this.staffInfoRepository = staffInfoRepository;
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
        Long infoId   = extractInfoId(user, primaryRole);

        String accessToken  = jwtUtil.generateAccessToken(uid, email, role, schoolId, infoId);
        String refreshToken = jwtUtil.generateRefreshToken(email, uid, role, infoId);

        saveRefreshToken(email, refreshToken);

        List<String> roles = userDTO.getCustomUserDTO().getRoles().stream()
                .map(UserRole::name)
                .collect(Collectors.toList());
        if (roles.isEmpty() && !"GUEST".equals(role)) {
            roles = List.of(role);
        }

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "role", role,
                "roles", roles,
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

        // Refresh Token에서 컨텍스트 복원 (role·uid·infoId 포함)
        String role   = jwtUtil.getRole(refreshToken);
        Long uid      = jwtUtil.getUid(refreshToken);
        Long infoId   = jwtUtil.getInfoId(refreshToken);

        User user = userRepository.findByEmail(email).orElse(null);
        UserRole userRole = role != null ? UserRole.valueOf(role) : null;
        Long schoolId = (infoId != null)
                ? extractSchoolIdByInfoId(user, userRole, infoId)
                : extractSchoolId(user, userRole);

        // 새 AccessToken + RefreshToken 재발급 (Rotation)
        String newAccessToken  = jwtUtil.generateAccessToken(uid, email, role, schoolId, infoId);
        String newRefreshToken = jwtUtil.generateRefreshToken(email, uid, role, infoId);
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
        Long infoId   = extractInfoId(user, userRole);
        String accessToken  = jwtUtil.generateAccessToken(uid, email, role, schoolId, infoId);
        String refreshToken = jwtUtil.generateRefreshToken(email, uid, role, infoId);
        saveRefreshToken(email, refreshToken);
        return Map.of("accessToken", accessToken, "refreshToken", refreshToken);
    }

    /**
     * 컨텍스트 전환 — Hub에서 다른 역할 인스턴스를 선택할 때 호출.
     * 해당 infoId 가 요청자(uid) 소유인지 검증 후 새 토큰 발급.
     *
     * @param uid    현재 로그인 유저
     * @param email  현재 로그인 유저 이메일
     * @param infoId 전환할 역할 인스턴스 ID
     * @param role   전환할 역할 타입 (예: "STUDENT")
     */
    @Transactional
    public Map<String, String> switchContext(Long uid, String email, Long infoId, String role) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        SchoolMemberInfo info = resolveInfo(user, role, infoId);
        if (info == null || !info.getUser().getUid().equals(uid)) {
            throw new SecurityException("해당 역할 인스턴스에 접근 권한이 없습니다.");
        }

        Long schoolId = info.getSchool() != null ? info.getSchool().getId() : null;
        String accessToken  = jwtUtil.generateAccessToken(uid, email, role, schoolId, infoId);
        String refreshToken = jwtUtil.generateRefreshToken(email, uid, role, infoId);
        saveRefreshToken(email, refreshToken);
        return Map.of("accessToken", accessToken, "refreshToken", refreshToken);
    }

    /**
     * 역할 인스턴스를 primary 로 지정.
     * 같은 (user, role) 의 다른 인스턴스는 primary=false 로 변경.
     */
    @Transactional
    public void setPrimary(Long uid, Long infoId, String role) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 같은 타입의 모든 인스턴스를 false로
        switch (UserRole.valueOf(role)) {
            case STUDENT -> studentInfoRepository.findAllByUserUid(uid)
                    .forEach(s -> s.setPrimary(false));
            case TEACHER -> teacherInfoRepository.findAllByUserUid(uid)
                    .forEach(t -> t.setPrimary(false));
            case STAFF -> staffInfoRepository.findAllByUserUid(uid)
                    .forEach(st -> st.setPrimary(false));
            default -> throw new IllegalArgumentException("지원하지 않는 역할 타입입니다.");
        }

        // 대상만 true
        SchoolMemberInfo info = resolveInfo(user, role, infoId);
        if (info == null || !info.getUser().getUid().equals(uid)) {
            throw new SecurityException("해당 역할 인스턴스에 접근 권한이 없습니다.");
        }
        info.setPrimary(true);
    }

    // ── 내부 헬퍼 ──────────────────────────────────────────────────────────

    /** primary info 의 학교 ID */
    private Long extractSchoolId(User user, UserRole role) {
        if (user == null || role == null) return null;
        SchoolMemberInfo info = switch (role) {
            case TEACHER -> user.getPrimaryInfo(TeacherInfo.class);
            case STUDENT -> user.getPrimaryInfo(StudentInfo.class);
            case STAFF   -> user.getPrimaryInfo(StaffInfo.class);
            default      -> null;
        };
        return (info != null && info.getSchool() != null) ? info.getSchool().getId() : null;
    }

    /** primary info 의 ID */
    private Long extractInfoId(User user, UserRole role) {
        if (user == null || role == null) return null;
        SchoolMemberInfo info = switch (role) {
            case TEACHER -> user.getPrimaryInfo(TeacherInfo.class);
            case STUDENT -> user.getPrimaryInfo(StudentInfo.class);
            case STAFF   -> user.getPrimaryInfo(StaffInfo.class);
            default      -> null;
        };
        return info != null ? info.getId() : null;
    }

    /** Refresh 시 infoId 로 schoolId 재조회 (컨텍스트 유지) */
    private Long extractSchoolIdByInfoId(User user, UserRole role, Long infoId) {
        if (user == null || role == null || infoId == null) return extractSchoolId(user, role);
        SchoolMemberInfo info = resolveInfo(user, role.name(), infoId);
        return (info != null && info.getSchool() != null) ? info.getSchool().getId() : null;
    }

    /** role 타입과 infoId로 실제 엔티티 조회 */
    private SchoolMemberInfo resolveInfo(User user, String role, Long infoId) {
        if (role == null || infoId == null) return null;
        return switch (UserRole.valueOf(role)) {
            case STUDENT -> studentInfoRepository.findById(infoId)
                    .filter(s -> s.getUser().getUid().equals(user.getUid()))
                    .orElse(null);
            case TEACHER -> teacherInfoRepository.findById(infoId)
                    .filter(t -> t.getUser().getUid().equals(user.getUid()))
                    .orElse(null);
            case STAFF -> staffInfoRepository.findById(infoId)
                    .filter(st -> st.getUser().getUid().equals(user.getUid()))
                    .orElse(null);
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
