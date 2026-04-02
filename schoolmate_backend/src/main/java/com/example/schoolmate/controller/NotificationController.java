package com.example.schoolmate.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.common.dto.NotificationDTO;
import com.example.schoolmate.common.service.NotificationService;
import com.example.schoolmate.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

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
}
