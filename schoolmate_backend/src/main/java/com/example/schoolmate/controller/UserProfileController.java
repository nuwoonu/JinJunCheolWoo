package com.example.schoolmate.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.service.FileManager;
import com.example.schoolmate.common.service.PasswordVerificationService;
import com.example.schoolmate.common.service.UserService;
import com.example.schoolmate.config.jwt.AuthService;
import com.example.schoolmate.dto.AuthUserDTO;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

/**
 * 내 프로필 관련 API
 * - POST /api/user/profile/image        : 프로필 이미지 변경
 * - POST /api/user/password/send-code   : 비밀번호 변경용 이메일 인증 코드 발송
 * - POST /api/user/password             : 비밀번호 변경 (인증 코드 검증 후 변경)
 * - POST /api/user/withdraw/send-code   : 회원 탈퇴용 이메일 인증 코드 발송
 * - POST /api/user/withdraw             : 회원 탈퇴 (인증 코드 검증 후 소프트 딜리트 + 로그아웃)
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final FileManager fileManager;
    private final UserService userService;
    private final PasswordVerificationService passwordVerificationService;
    private final AuthService authService;

    /**
     * 프로필 이미지 업로드
     */
    @PostMapping("/profile/image")
    public ResponseEntity<Map<String, Object>> uploadProfileImage(
            @AuthenticationPrincipal AuthUserDTO auth,
            @RequestParam MultipartFile file) {

        if (auth == null) return ResponseEntity.status(401).build();
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "파일이 없습니다."));
        }

        Long uid = auth.getCustomUserDTO().getUid();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        String oldFilename = profileRepository.findByUser(user)
                .map(p -> p.getUuid()).orElse(null);
        String savedFilename = fileManager.replace(file, oldFilename, FileManager.UploadType.PROFILE);
        if (savedFilename == null) {
            return ResponseEntity.internalServerError().body(Map.of("message", "파일 저장에 실패했습니다."));
        }

        Profile profile = profileRepository.findByUser(user)
                .orElseGet(() -> Profile.builder().user(user).build());
        profile.changeUuid(savedFilename);
        profile.changePath("profile");
        profile.changeImgName(file.getOriginalFilename());
        profileRepository.save(profile);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("profileImageUrl", FileManager.UploadType.PROFILE.toUrl(savedFilename));
        return ResponseEntity.ok(result);
    }

    /**
     * 비밀번호 변경용 이메일 인증 코드 발송
     * 소셜 로그인 계정은 불가
     */
    @PostMapping("/password/send-code")
    public ResponseEntity<Map<String, Object>> sendPasswordVerificationCode(
            @AuthenticationPrincipal AuthUserDTO auth) {

        if (auth == null) return ResponseEntity.status(401).build();

        Long uid = auth.getCustomUserDTO().getUid();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!user.hasPassword()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "비밀번호가 설정되지 않은 계정입니다. 비밀번호를 변경할 수 없습니다."));
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
     * 비밀번호 변경 (인증 코드 검증 후 변경)
     */
    @PostMapping("/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @AuthenticationPrincipal AuthUserDTO auth,
            @RequestBody PasswordChangeRequest req) {

        if (auth == null) return ResponseEntity.status(401).build();

        Long uid = auth.getCustomUserDTO().getUid();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!user.hasPassword()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "비밀번호가 설정되지 않은 계정입니다. 비밀번호를 변경할 수 없습니다."));
        }

        try {
            passwordVerificationService.verifyAndDelete(uid, req.getVerificationCode());
            userService.changePassword(uid, req.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 회원 탈퇴용 이메일 인증 코드 발송
     */
    @PostMapping("/withdraw/send-code")
    public ResponseEntity<Map<String, Object>> sendWithdrawalCode(
            @AuthenticationPrincipal AuthUserDTO auth) {

        if (auth == null) return ResponseEntity.status(401).build();

        Long uid = auth.getCustomUserDTO().getUid();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        try {
            passwordVerificationService.sendWithdrawalCode(user);
            return ResponseEntity.ok(Map.of("message", "인증 코드가 발송되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "인증 코드 발송에 실패했습니다. 잠시 후 다시 시도해주세요."));
        }
    }

    /**
     * 회원 탈퇴 (인증 코드 검증 후 소프트 딜리트 + 로그아웃)
     */
    @PostMapping("/withdraw")
    public ResponseEntity<Map<String, Object>> withdraw(
            @AuthenticationPrincipal AuthUserDTO auth,
            @RequestBody WithdrawRequest req,
            HttpServletResponse response) {

        if (auth == null) return ResponseEntity.status(401).build();

        Long uid = auth.getCustomUserDTO().getUid();
        String email = auth.getCustomUserDTO().getEmail();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        try {
            passwordVerificationService.verifyAndDelete(uid, req.getVerificationCode());
            user.withdraw();
            userRepository.save(user);
            authService.logout(email);

            Cookie cookie = new Cookie("accessToken", "");
            cookie.setMaxAge(0);
            cookie.setPath("/");
            response.addCookie(cookie);

            return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @Getter
    @NoArgsConstructor
    static class PasswordChangeRequest {
        private String verificationCode;
        private String newPassword;
    }

    @Getter
    @NoArgsConstructor
    static class WithdrawRequest {
        private String verificationCode;
    }
}
