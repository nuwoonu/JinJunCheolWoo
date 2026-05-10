package com.example.schoolmate.schoolmate_backend_app.controller;

import com.example.schoolmate.schoolmate_backend_app.service.ExpoPushService;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// [woo] APP 푸시 토큰 등록/해제 API
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushTokenController {

    private final ExpoPushService expoPushService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @AuthenticationPrincipal AuthUserDTO auth,
            @RequestBody Map<String, String> body) {
        if (auth == null) return ResponseEntity.status(401).build();

        String token = body.get("token");
        String platform = body.get("platform");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "token이 필요합니다."));
        }

        User user = userRepository.findById(auth.getCustomUserDTO().getUid()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        expoPushService.registerToken(user, token, platform);
        return ResponseEntity.ok(Map.of("message", "등록 완료"));
    }

    @DeleteMapping("/unregister")
    public ResponseEntity<?> unregister(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token != null) {
            expoPushService.unregisterToken(token);
        }
        return ResponseEntity.ok(Map.of("message", "해제 완료"));
    }
}
