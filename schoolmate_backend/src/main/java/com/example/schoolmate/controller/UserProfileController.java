package com.example.schoolmate.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
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
import com.example.schoolmate.common.service.FileService;
import com.example.schoolmate.common.service.UserService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.PasswordDTO;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

/**
 * 내 프로필 관련 API
 * - POST /api/user/profile/image : 프로필 이미지 변경
 * - POST /api/user/password      : 비밀번호 변경 (이메일 계정 전용)
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final FileService fileService;
    private final UserService userService;

    /**
     * 프로필 이미지 업로드
     * multipart/form-data, field name: file
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

        // 기존 이미지 파일 삭제
        profileRepository.findByUser(user).ifPresent(existing -> {
            if (existing.getUuid() != null) {
                fileService.delete(existing.getUuid(), "profile");
            }
        });

        String savedFilename = fileService.upload(file, "profile");
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
        result.put("profileImageUrl", "/upload/profile/" + savedFilename);
        return ResponseEntity.ok(result);
    }

    /**
     * 비밀번호 변경 (이메일 계정 전용)
     * 소셜 로그인 사용자는 provider != null 이므로 클라이언트에서 차단
     */
    @PostMapping("/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @AuthenticationPrincipal AuthUserDTO auth,
            @RequestBody PasswordChangeRequest req) {

        if (auth == null) return ResponseEntity.status(401).build();

        Long uid = auth.getCustomUserDTO().getUid();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (user.getProvider() != null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다."));
        }

        try {
            userService.changePassword(PasswordDTO.builder()
                    .email(user.getEmail())
                    .currentPassword(req.getCurrentPassword())
                    .newPassword(req.getNewPassword())
                    .build());
            return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @Getter
    @NoArgsConstructor
    static class PasswordChangeRequest {
        private String currentPassword;
        private String newPassword;
    }
}
