package com.example.schoolmate.controller;

import com.example.schoolmate.common.entity.info.SchoolMemberInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.user.RoleRequest;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.RoleRequestStatus;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.RoleRequestRepository;
import com.example.schoolmate.common.repository.SchoolAdminGrantRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.UserSocialAccountRepository;
import com.example.schoolmate.common.repository.info.staff.StaffInfoRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.service.FileManager;
import com.example.schoolmate.common.service.UserService;
import com.example.schoolmate.config.jwt.AuthService;
import com.example.schoolmate.common.util.LogHelper;
import com.example.schoolmate.domain.school.dto.SchoolDTO;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.school.service.SchoolService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.CustomUserDTO;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * JWT 기반 인증 REST API
 * - POST /api/auth/register : 이메일 회원가입 → 가입 즉시 JWT 발급
 * - POST /api/auth/login : 이메일/비밀번호 로그인 → JWT 발급
 * - POST /api/auth/refresh : Refresh Token으로 새 Access Token 발급
 * - POST /api/auth/logout : 로그아웃 (Refresh Token 삭제)
 * - GET /api/auth/me : 현재 로그인 사용자 정보 반환
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthApiController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final com.example.schoolmate.common.service.PasswordVerificationService passwordVerificationService;
    private final SchoolService schoolService;
    private final SchoolAdminGrantRepository schoolAdminGrantRepository;
    private final RoleRequestRepository roleRequestRepository;
    private final SchoolRepository schoolRepository;
    private final com.example.schoolmate.common.repository.ProfileRepository profileRepository;
    private final UserSocialAccountRepository socialAccountRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StaffInfoRepository staffInfoRepository;

    /**
     * 이메일 회원가입 → 가입 완료 즉시 JWT 발급 (React 프론트엔드용)
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String phoneNumber = body.get("phoneNumber");
        String roleStr = body.get("role");
        String schoolIdStr = body.get("schoolId");

        if (name == null || email == null || password == null || roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "필수 항목이 누락되었습니다."));
        }

        try {
            UserRole role = UserRole.valueOf(roleStr.toUpperCase());
            Long schoolId = null;
            if (schoolIdStr != null && !schoolIdStr.isBlank()) {
                schoolId = Long.parseLong(schoolIdStr);
            }
            CustomUserDTO dto = CustomUserDTO.builder()
                    .name(name)
                    .email(email)
                    .password(password)
                    .phoneNumber(phoneNumber)
                    .role(role)
                    .schoolId(schoolId)
                    .build();

            userService.join(dto);

            // 가입 즉시 JWT 발급 → 로그인 페이지 이동 없이 바로 대시보드로
            Map<String, Object> result = authService.login(email, password);
            log.info("회원가입 및 JWT 발급 완료 - email: {}, role: {}", email, role);
            return ResponseEntity.ok(result);

        } catch (IllegalStateException e) {
            // [woo] 이메일 중복 - @Transactional 제거 후 IllegalStateException 정상 전파되도록 수정
            return ResponseEntity.status(409).body(Map.of("message", "중복된 이메일입니다. 다른 이메일을 입력해주세요."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("회원가입 처리 중 오류", e);
            return ResponseEntity.status(500).body(Map.of("message", "회원가입 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "이메일과 비밀번호를 입력해주세요."));
        }

        try {
            Map<String, Object> result = authService.login(email, password);
            LogHelper.access(email, getClientIp(request), request.getHeader("User-Agent"), "LOGIN");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            LogHelper.access(email, getClientIp(request), request.getHeader("User-Agent"), "LOGIN_FAIL");
            return ResponseEntity.status(401).body(Map.of("message", "이메일 또는 비밀번호가 올바르지 않습니다."));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");

        if (refreshToken == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Refresh Token이 없습니다."));
        }

        try {
            Map<String, String> result = authService.refresh(refreshToken);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal AuthUserDTO user,
                                    HttpServletRequest request, HttpServletResponse response) {
        if (user != null) {
            authService.logout(user.getUsername());
            LogHelper.access(user.getUsername(), getClientIp(request), request.getHeader("User-Agent"), "LOGOUT");
        }
        // [woo] 응답 헤더로 accessToken 쿠키 만료 - JS 쿠키 삭제보다 신뢰성 높음
        Cookie expiredCookie = new Cookie("accessToken", "");
        expiredCookie.setMaxAge(0);
        expiredCookie.setPath("/");
        response.addCookie(expiredCookie);
        return ResponseEntity.ok(Map.of("message", "로그아웃되었습니다."));
    }


    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal AuthUserDTO user) {
        if (user == null) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }
        UserRole primaryRole = user.getPrimaryRole();
        String roleName = primaryRole != null ? primaryRole.name() : "GUEST";
        String name = user.getCustomUserDTO().getName();

        // 유저가 보유한 모든 역할 목록
        List<String> roles = user.getCustomUserDTO().getRoles().stream()
                .map(UserRole::name)
                .collect(Collectors.toList());
        if (roles.isEmpty() && !"GUEST".equals(roleName)) {
            roles = List.of(roleName);
        }

        Long uid = user.getCustomUserDTO().getUid();
        User dbUser = userRepository.findById(uid).orElse(null);

        // 역할 신청 목록 (Hub 카드 상태 표시용)
        List<Map<String, Object>> roleRequests = List.of();
        if (dbUser != null) {
            roleRequests = roleRequestRepository.findByUser(dbUser).stream()
                    .map(rr -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("role", rr.getRole().name());
                        map.put("status", rr.getStatus().name());
                        map.put("schoolId", rr.getSchoolId() != null ? rr.getSchoolId() : "");
                        if (rr.getSchoolId() != null) {
                            schoolRepository.findById(rr.getSchoolId())
                                    .ifPresent(school -> map.put("schoolName", school.getName()));
                        }
                        return map;
                    })
                    .collect(Collectors.toList());
        }

        // GrantedRole 목록 구성
        // — ADMIN role 보유 시 SUPER_ADMIN을 합성 항목으로 포함 (DB에는 저장하지 않음)
        // — 그 외 사용자는 SchoolAdminGrant 실제 레코드를 포함
        List<Map<String, Object>> grants = new ArrayList<>();
        if (primaryRole == UserRole.ADMIN) {
            Map<String, Object> superAdminGrant = new HashMap<>();
            superAdminGrant.put("grantedRole", "SUPER_ADMIN");
            grants.add(superAdminGrant);
        }
        if (dbUser != null) {
            schoolAdminGrantRepository.findByUser(dbUser).forEach(g -> {
                Map<String, Object> grantMap = new HashMap<>();
                grantMap.put("grantedRole", g.getGrantedRole().name());
                grantMap.put("schoolId", g.getSchool().getId());
                grantMap.put("schoolName", g.getSchool().getName());
                grantMap.put("schoolCode", g.getSchool().getSchoolCode());
                grantMap.put("schoolKind", g.getSchool().getSchoolKind());
                grantMap.put("officeOfEducation", g.getSchool().getOfficeOfEducation());
                grants.add(grantMap);
            });
        }

        // hasAdminAccess: grants가 하나라도 있으면 어드민 페이지 접근 가능
        boolean hasAdminAccess = !grants.isEmpty();

        // 연동된 소셜 계정 목록 및 비밀번호 설정 여부
        List<String> providers = dbUser != null
                ? socialAccountRepository.findByUser(dbUser).stream()
                        .map(sa -> sa.getProvider())
                        .collect(Collectors.toList())
                : List.of();
        boolean hasPassword = dbUser != null && dbUser.hasPassword();

        // 프로필 이미지 URL
        String profileImageUrl = null;
        if (dbUser != null) {
            profileImageUrl = profileRepository.findByUser(dbUser)
                    .filter(p -> p.getUuid() != null)
                    .map(p -> FileManager.UploadType.PROFILE.toUrl(p.getUuid()))
                    .orElse(null);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", true);
        response.put("uid", uid);
        response.put("email", user.getUsername());
        response.put("name", name != null ? name : "소셜사용자");
        response.put("role", roleName);
        response.put("roles", roles);
        response.put("hasAdminAccess", hasAdminAccess);
        response.put("grants", grants);
        response.put("roleRequests", roleRequests);
        response.put("providers", providers);
        response.put("hasPassword", hasPassword);
        response.put("profileImageUrl", profileImageUrl);

        return ResponseEntity.ok(response);
    }

    /**
     * 소셜 로그인 후 역할 선택 (GUEST → 실제 역할)
     * - GUEST JWT를 가진 사용자만 호출 가능
     * - 역할 설정 후 해당 역할의 새 JWT 발급
     */
    @PostMapping("/select-role")
    public ResponseEntity<?> selectRole(
            @AuthenticationPrincipal AuthUserDTO user,
            @RequestBody Map<String, String> body) {

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "인증이 필요합니다."));
        }

        String roleStr = body.get("role");
        if (roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "역할을 선택해주세요."));
        }

        try {
            UserRole userRole = UserRole.valueOf(roleStr.toUpperCase());
            String email = user.getUsername();

            User dbUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            Long schoolId = null;
            String schoolIdStr = body.get("schoolId");
            if (schoolIdStr != null && !schoolIdStr.isBlank()) {
                schoolId = Long.parseLong(schoolIdStr);
            }

            boolean isSuperAdmin = dbUser.getRoles().contains(UserRole.ADMIN);

            // 역할을 user.roles에 추가 (PENDING 포함) — 다음 SNS 로그인 시 GUEST로 돌아가지 않도록
            dbUser.addRole(userRole);
            userService.createSocialUserInfo(dbUser, userRole, schoolId);

            // 항상 JWT 발급 — 프론트엔드의 Hub가 roleRequests 상태로 pending/active 판단
            String status = isSuperAdmin ? "active" : "pending";
            Map<String, String> tokens = authService.issueTokensForOAuth2(dbUser.getUid(), email, userRole.name());
            log.info("역할 선택 완료 - email: {}, role: {}, status: {}", email, userRole, status);
            return ResponseEntity.ok(Map.of(
                    "accessToken", tokens.get("accessToken"),
                    "refreshToken", tokens.get("refreshToken"),
                    "role", userRole.name(),
                    "status", status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("역할 선택 처리 중 오류", e);
            return ResponseEntity.status(500).body(Map.of("message", "역할 선택 중 오류가 발생했습니다."));
        }
    }

    /**
     * 비밀번호 찾기 — 인증 코드 발송 (비인증 접근)
     * 이메일로 사용자를 조회하여 코드 발송. 소셜 계정은 거부.
     */
    @PostMapping("/password/send-code")
    public ResponseEntity<?> sendPasswordResetCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "이메일을 입력해주세요."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "가입되지 않은 이메일입니다."));
        }

        User user = userOpt.get();
        if (!user.hasPassword()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "비밀번호가 설정되지 않은 계정입니다. 비밀번호 찾기를 이용할 수 없습니다."));
        }

        try {
            passwordVerificationService.sendCode(user);
            return ResponseEntity.ok(Map.of("message", "인증 코드가 발송되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "인증 코드 발송에 실패했습니다. 잠시 후 다시 시도해주세요."));
        }
    }

    /**
     * 비밀번호 찾기 — 코드 검증 후 비밀번호 재설정 (비인증 접근)
     */
    @PostMapping("/password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("verificationCode");
        String newPassword = body.get("newPassword");

        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "필수 항목이 누락되었습니다."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "가입되지 않은 이메일입니다."));
        }

        User user = userOpt.get();
        try {
            passwordVerificationService.verifyAndDelete(user.getUid(), code);
            userService.changePassword(user.getUid(), newPassword);
            return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Hub — 현재 유저의 모든 역할 인스턴스 목록 반환.
     * 프론트엔드 Hub 페이지에서 역할 카드를 표시할 때 사용합니다.
     */
    @GetMapping("/role-contexts")
    public ResponseEntity<?> roleContexts(@AuthenticationPrincipal AuthUserDTO auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Long uid = auth.getCustomUserDTO().getUid();

        List<Map<String, Object>> contexts = new ArrayList<>();

        studentInfoRepository.findAllByUserUid(uid).forEach(s -> {
            Long schoolId = s.getSchool() != null ? s.getSchool().getId() : null;
            RoleRequestStatus rrStatus = resolveRoleRequestStatus(s.getUser(), UserRole.STUDENT, schoolId);
            boolean isActive = s.getStatus().isCurrentStudent() && rrStatus == RoleRequestStatus.ACTIVE;
            String statusDesc = rrStatusDesc(rrStatus, s.getStatus().getDescription());
            contexts.add(buildContext(s, "STUDENT", s.getStatus().name(), statusDesc, isActive));
        });

        teacherInfoRepository.findAllByUserUid(uid).forEach(t -> {
            Long schoolId = t.getSchool() != null ? t.getSchool().getId() : null;
            RoleRequestStatus rrStatus = resolveRoleRequestStatus(t.getUser(), UserRole.TEACHER, schoolId);
            boolean infoActive = t.getStatus() == TeacherStatus.EMPLOYED || t.getStatus() == TeacherStatus.LEAVE;
            boolean isActive = infoActive && rrStatus == RoleRequestStatus.ACTIVE;
            String statusDesc = rrStatusDesc(rrStatus, t.getStatus().getDescription());
            contexts.add(buildContext(t, "TEACHER", t.getStatus().name(), statusDesc, isActive));
        });

        staffInfoRepository.findAllByUserUid(uid).forEach(st -> {
            Long schoolId = st.getSchool() != null ? st.getSchool().getId() : null;
            RoleRequestStatus rrStatus = resolveRoleRequestStatus(st.getUser(), UserRole.STAFF, schoolId);
            boolean infoActive = st.getStatus() == StaffStatus.EMPLOYED || st.getStatus() == StaffStatus.LEAVE
                    || st.getStatus() == StaffStatus.DISPATCHED;
            boolean isActive = infoActive && rrStatus == RoleRequestStatus.ACTIVE;
            String statusDesc = rrStatusDesc(rrStatus, st.getStatus().getDescription());
            contexts.add(buildContext(st, "STAFF", st.getStatus().name(), statusDesc, isActive));
        });

        return ResponseEntity.ok(Map.of("contexts", contexts));
    }

    /**
     * Hub — 다른 역할 인스턴스로 컨텍스트 전환. 새 JWT 쌍을 반환합니다.
     * body: { infoId: 42, role: "STUDENT" }
     */
    @PostMapping("/switch-context")
    public ResponseEntity<?> switchContext(@AuthenticationPrincipal AuthUserDTO auth,
                                           @RequestBody Map<String, Object> body) {
        if (auth == null) return ResponseEntity.status(401).build();

        Long infoId = body.get("infoId") instanceof Number n ? n.longValue() : null;
        String role = (String) body.get("role");
        if (infoId == null || role == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "infoId와 role이 필요합니다."));
        }

        try {
            Long uid = auth.getCustomUserDTO().getUid();
            String email = auth.getUsername();
            Map<String, String> tokens = authService.switchContext(uid, email, infoId, role.toUpperCase());
            return ResponseEntity.ok(tokens);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Hub — 특정 역할 인스턴스를 primary(메인)로 지정합니다.
     * body: { infoId: 42, role: "STUDENT" }
     */
    @PatchMapping("/primary-role")
    @Transactional
    public ResponseEntity<?> setPrimaryRole(@AuthenticationPrincipal AuthUserDTO auth,
                                            @RequestBody Map<String, Object> body) {
        if (auth == null) return ResponseEntity.status(401).build();

        Long infoId = body.get("infoId") instanceof Number n ? n.longValue() : null;
        String role = (String) body.get("role");
        if (infoId == null || role == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "infoId와 role이 필요합니다."));
        }

        try {
            authService.setPrimary(auth.getCustomUserDTO().getUid(), infoId, role.toUpperCase());
            return ResponseEntity.ok(Map.of("message", "메인 역할이 변경되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private Map<String, Object> buildContext(SchoolMemberInfo info, String roleType,
                                              String statusCode, String statusDesc, boolean isActive) {
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("infoId",     info.getId());
        ctx.put("roleType",   roleType);
        ctx.put("schoolId",   info.getSchool() != null ? info.getSchool().getId()   : null);
        ctx.put("schoolName", info.getSchool() != null ? info.getSchool().getName() : null);
        ctx.put("status",     statusCode);
        ctx.put("statusDesc", statusDesc);
        ctx.put("isPrimary",  info.isPrimary());
        ctx.put("isActive",   isActive);
        return ctx;
    }

    /** RoleRequest 상태 조회 — 없으면 ACTIVE로 간주 (어드민 직접 등록 등 구버전 데이터 호환) */
    private RoleRequestStatus resolveRoleRequestStatus(User user, UserRole role, Long schoolId) {
        Optional<RoleRequest> rr = schoolId != null
                ? roleRequestRepository.findByUserAndRoleAndSchoolId(user, role, schoolId)
                : roleRequestRepository.findByUserAndRoleAndSchoolIdIsNull(user, role);
        return rr.map(RoleRequest::getStatus).orElse(RoleRequestStatus.ACTIVE);
    }

    /** RoleRequest 상태에 따른 사용자 표시 설명 */
    private String rrStatusDesc(RoleRequestStatus status, String infoStatusDesc) {
        return switch (status) {
            case PENDING   -> "승인 대기 중";
            case REJECTED  -> "역할 신청이 거절되었습니다";
            case SUSPENDED -> "역할이 정지되었습니다";
            default        -> infoStatusDesc;
        };
    }
}
