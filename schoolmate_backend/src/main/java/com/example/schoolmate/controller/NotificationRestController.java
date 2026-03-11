package com.example.schoolmate.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.dto.NotificationDTO;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.service.NotificationService;
import com.example.schoolmate.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;

// [woo] 로그인 유저 본인의 알림 조회/읽음처리 API
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationRestController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // 내 알림 목록
    @GetMapping
    public ResponseEntity<List<NotificationDTO.NotificationHistory>> getMyNotifications(Authentication auth) {
        Long uid = getUid(auth);
        if (uid == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(notificationService.getMyNotifications(uid));
    }

    // 읽지 않은 알림 수
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        Long uid = getUid(auth);
        if (uid == null) return ResponseEntity.ok(Map.of("count", 0L));
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(uid)));
    }

    // 특정 알림 읽음 처리
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication auth) {
        Long uid = getUid(auth);
        if (uid == null) return ResponseEntity.status(401).build();
        notificationService.markAsRead(id, uid);
        return ResponseEntity.ok().build();
    }

    // 전체 읽음 처리
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication auth) {
        Long uid = getUid(auth);
        if (uid == null) return ResponseEntity.status(401).build();
        notificationService.markAllAsRead(uid);
        return ResponseEntity.ok().build();
    }

    private Long getUid(Authentication authentication) {
        if (authentication == null) return null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthUserDTO authUserDTO) {
            return authUserDTO.getCustomUserDTO().getUid();
        }
        if (principal instanceof OAuth2User oAuth2User) {
            Map<String, Object> attrs = oAuth2User.getAttributes();
            String provider = attrs.containsKey("sub") ? "google"
                    : attrs.containsKey("id") ? "kakao" : null;
            String providerId = provider != null
                    ? (provider.equals("google") ? String.valueOf(attrs.get("sub")) : String.valueOf(attrs.get("id")))
                    : null;
            if (provider != null && providerId != null) {
                return userRepository.findByProviderAndProviderId(provider, providerId)
                        .map(User::getUid).orElse(null);
            }
        }
        return null;
    }
}
