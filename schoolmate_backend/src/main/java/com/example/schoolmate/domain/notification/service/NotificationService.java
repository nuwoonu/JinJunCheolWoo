package com.example.schoolmate.domain.notification.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.notification.dto.NotificationDTO;
import com.example.schoolmate.domain.notification.entity.Notification;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.domain.notification.repository.NotificationRepository;
import com.example.schoolmate.schoolmate_backend_app.service.ExpoPushService; // [woo] Expo FCM 푸시

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;
    private final ExpoPushService expoPushService; // [woo] Expo FCM 무조건 발송

    // 알림 발송 (발신자 UID는 컨트롤러에서 인증 정보로 전달)
    public void sendNotification(NotificationDTO.SendRequest request, Long senderUid) {
        log.info("알림 발송: senderUid={}, receiverUid={}, title={}", senderUid, request.getReceiverUid(), request.getTitle());
        User sender = userRepository.findById(senderUid)
                .orElseThrow(() -> new IllegalArgumentException("발신자를 찾을 수 없습니다."));

        User receiver = userRepository.findById(request.getReceiverUid())
                .orElseThrow(() -> new IllegalArgumentException("수신자를 찾을 수 없습니다."));

        Notification notification = new Notification();
        notification.setSender(sender);
        notification.setReceiver(receiver);
        notification.setTitle(request.getTitle());
        notification.setContent(request.getContent());
        notification.setRead(false);
        notification.setDeleted(false);

        notificationRepository.save(notification);

        pushNotificationService.sendToUser(receiver, request.getTitle(), request.getContent(), null);
    }

    // 내 알림 목록 조회 (논리 삭제 제외, 최신순)
    @Transactional(readOnly = true)
    public List<NotificationDTO.NotificationHistory> getMyNotifications(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return notificationRepository.findActiveByReceiver(user)
                .stream()
                .map(NotificationDTO.NotificationHistory::new)
                .collect(Collectors.toList());
    }

    // 읽지 않은 알림 수 (논리 삭제 제외)
    @Transactional(readOnly = true)
    public long getUnreadCount(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return notificationRepository.countUnreadActiveByReceiver(user);
    }

    // 특정 알림 읽음 처리
    public void markAsRead(Long notificationId, Long uid) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getReceiver().getUid().equals(uid)) {
            throw new IllegalArgumentException("본인의 알림만 읽을 수 있습니다.");
        }
        notification.setRead(true);
    }

    // 전체 읽음 처리 (논리 삭제 제외)
    public void markAllAsRead(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        notificationRepository.findActiveByReceiver(user)
                .forEach(n -> n.setRead(true));
    }

    // 내부 알림 생성 헬퍼 (User 객체 직접 사용, sender null = 시스템 알림)
    public void notifyUser(User sender, User receiver, String title, String content) {
        notifyUser(sender, receiver, title, content, null);
    }

    // actionUrl 포함 버전 (클릭 시 특정 페이지로 이동)
    public void notifyUser(User sender, User receiver, String title, String content, String actionUrl) {
        Notification n = new Notification();
        n.setSender(sender);
        n.setReceiver(receiver);
        n.setTitle(title);
        n.setContent(content);
        n.setRead(false);
        n.setDeleted(false);
        n.setActionUrl(actionUrl);
        notificationRepository.save(n);

        // [woo] 웹 푸시 (VAPID)
        pushNotificationService.sendToUser(receiver, title, content, actionUrl);
        // [woo] Expo FCM 푸시 — 무조건 발송
        expoPushService.sendPush(receiver, title, content, actionUrl);
    }

    // 알림 논리 삭제
    public void deleteNotification(Long notificationId, Long uid) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getReceiver().getUid().equals(uid)) {
            throw new IllegalArgumentException("본인의 알림만 삭제할 수 있습니다.");
        }
        notification.setDeleted(true);
    }
}
