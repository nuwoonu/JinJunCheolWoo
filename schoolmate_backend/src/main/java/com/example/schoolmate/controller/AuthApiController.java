package com.example.schoolmate.controller;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.service.UserService;
import com.example.schoolmate.config.jwt.AuthService;
import com.example.schoolmate.domain.log.entity.AccessLog;
import com.example.schoolmate.domain.log.service.LogService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.CustomUserDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
    private final LogService logService;

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

        if (name == null || email == null || password == null || roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "필수 항목이 누락되었습니다."));
        }

        try {
            UserRole role = UserRole.valueOf(roleStr.toUpperCase());
            CustomUserDTO dto = CustomUserDTO.builder()
                    .name(name)
                    .email(email)
                    .password(password)
                    .phoneNumber(phoneNumber)
                    .role(role)
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
            logService.logAccess(email, getClientIp(request), request.getHeader("User-Agent"),
                    AccessLog.AccessType.LOGIN);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logService.logAccess(email, getClientIp(request), request.getHeader("User-Agent"),
                    AccessLog.AccessType.LOGIN_FAIL);
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
    public ResponseEntity<?> logout(@AuthenticationPrincipal AuthUserDTO user, HttpServletRequest request) {
        if (user != null) {
            authService.logout(user.getUsername());
            logService.logAccess(user.getUsername(), getClientIp(request), request.getHeader("User-Agent"),
                    AccessLog.AccessType.LOGOUT);
        }
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
            return ResponseEntity.status(401).body(Map.of("authenticated", false));
        }
        // [woo] getPrimaryRole()이 null일 수 있음 (OAuth2 신규 GUEST 유저 - DB에 roles 없음)
        UserRole primaryRole = user.getPrimaryRole();
        String roleName = primaryRole != null ? primaryRole.name() : "GUEST";
        String name = user.getCustomUserDTO().getName();

        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "uid", user.getCustomUserDTO().getUid(),
                "email", user.getUsername(),
                "name", name != null ? name : "소셜사용자",
                "role", roleName));
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

            dbUser.addRole(userRole);
            userService.createSocialUserInfo(dbUser, userRole);

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
