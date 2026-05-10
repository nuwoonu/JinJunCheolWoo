package com.example.schoolmate.domain.notification.controller;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.domain.notification.dto.NotificationDTO;
import com.example.schoolmate.domain.notification.service.NotificationService;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.schoolmate_backend_app.entity.NotificationPreference;
import com.example.schoolmate.schoolmate_backend_app.repository.NotificationPreferenceRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationPreferenceRepository preferenceRepository; // [woo] 알림 설정
    private final UserRepository userRepository; // [woo] 알림 설정

    // 내 알림 목록
    @GetMapping
    public ResponseEntity<List<NotificationDTO.NotificationHistory>> getMyNotifications(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        if (authUser == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(notificationService.getMyNotifications(authUser.getCustomUserDTO().getUid()));
    }

    // 읽지 않은 알림 수
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        if (authUser == null)
            return ResponseEntity.ok(Map.of("count", 0L));
        return ResponseEntity
                .ok(Map.of("count", notificationService.getUnreadCount(authUser.getCustomUserDTO().getUid())));
    }

    // 특정 알림 읽음 처리
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        if (authUser == null)
            return ResponseEntity.status(401).build();
        notificationService.markAsRead(id, authUser.getCustomUserDTO().getUid());
        return ResponseEntity.ok().build();
    }

    // 전체 읽음 처리
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal AuthUserDTO authUser) {
        if (authUser == null)
            return ResponseEntity.status(401).build();
        notificationService.markAllAsRead(authUser.getCustomUserDTO().getUid());
        return ResponseEntity.ok().build();
    }

    // 알림 논리 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        if (authUser == null)
            return ResponseEntity.status(401).build();
        notificationService.deleteNotification(id, authUser.getCustomUserDTO().getUid());
        return ResponseEntity.ok().build();
    }

    // [woo] 알림 설정 조회
    @GetMapping("/preferences")
    public ResponseEntity<Map<String, Object>> getPreferences(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        if (authUser == null) return ResponseEntity.status(401).build();
        Long uid = authUser.getCustomUserDTO().getUid();
        NotificationPreference pref = preferenceRepository.findByUserUid(uid)
                .orElseGet(() -> {
                    NotificationPreference def = new NotificationPreference();
                    def.setUser(userRepository.getReferenceById(uid));
                    return def;
                });
        return ResponseEntity.ok(Map.of(
                "pushEnabled", pref.isPushEnabled(),
                "quietHoursEnabled", pref.isQuietHoursEnabled(),
                "quietStart", pref.getQuietStart() != null ? pref.getQuietStart().toString().substring(0, 5) : "22:00",
                "quietEnd", pref.getQuietEnd() != null ? pref.getQuietEnd().toString().substring(0, 5) : "06:00"
        ));
    }

    // [woo] 알림 설정 저장
    @PutMapping("/preferences")
    @Transactional
    public ResponseEntity<Void> updatePreferences(
            @AuthenticationPrincipal AuthUserDTO authUser,
            @RequestBody Map<String, Object> body) {
        if (authUser == null) return ResponseEntity.status(401).build();
        Long uid = authUser.getCustomUserDTO().getUid();
        NotificationPreference pref = preferenceRepository.findByUserUid(uid)
                .orElseGet(() -> {
                    User user = userRepository.getReferenceById(uid);
                    NotificationPreference np = new NotificationPreference();
                    np.setUser(user);
                    return np;
                });
        if (body.containsKey("pushEnabled"))
            pref.setPushEnabled(Boolean.TRUE.equals(body.get("pushEnabled")));
        if (body.containsKey("quietHoursEnabled"))
            pref.setQuietHoursEnabled(Boolean.TRUE.equals(body.get("quietHoursEnabled")));
        if (body.containsKey("quietStart"))
            pref.setQuietStart(LocalTime.parse((String) body.get("quietStart")));
        if (body.containsKey("quietEnd"))
            pref.setQuietEnd(LocalTime.parse((String) body.get("quietEnd")));
        preferenceRepository.save(pref);
        return ResponseEntity.ok().build();
    }
}
