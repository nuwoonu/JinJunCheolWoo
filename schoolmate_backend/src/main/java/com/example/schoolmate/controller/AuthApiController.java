package com.example.schoolmate.controller;

import com.example.schoolmate.common.entity.user.RoleRequest;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.RoleRequestRepository;
import com.example.schoolmate.common.repository.SchoolAdminGrantRepository;
import com.example.schoolmate.common.repository.UserRepository;
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
    private final SchoolService schoolService;
    private final SchoolAdminGrantRepository schoolAdminGrantRepository;
    private final RoleRequestRepository roleRequestRepository;
    private final SchoolRepository schoolRepository;

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

        return ResponseEntity.ok(response);
    }

    /**
     * 소셜 로그인 후 역할 선택 (GUEST → 실제 역할)
     * - GUEST JWT를 가진 사용자만 호출 가능
     * - 역할 설정 후 해당 역할의 새 JWT 발급
     */
    @PostMapping("/select-role")
    @Transactional
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

            dbUser.addRole(userRole);
            userService.createSocialUserInfo(dbUser, userRole, schoolId);

            log.info("역할 선택 완료 - email: {}, role: {}", email, userRole);

            Map<String, String> tokens = authService.issueTokensForOAuth2(dbUser.getUid(), email, userRole.name());
            return ResponseEntity.ok(Map.of(
                    "accessToken", tokens.get("accessToken"),
                    "refreshToken", tokens.get("refreshToken"),
                    "role", userRole.name()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("역할 선택 처리 중 오류", e);
            return ResponseEntity.status(500).body(Map.of("message", "역할 선택 중 오류가 발생했습니다."));
        }
    }
}
