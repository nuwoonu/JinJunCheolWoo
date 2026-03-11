package com.example.schoolmate.common.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.NotificationDTO;
import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.notice.NotificationRepository;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 알림 발송 서비스
 *
 * 관리자가 특정 사용자(학부모, 교사 등)에게 시스템 알림을 전송하는 기능을 담당합니다.
 * - 알림 엔티티 생성 및 저장
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void sendNotification(NotificationDTO.SendRequest request) {
        User sender = userRepository.findById(request.getSenderUid())
                .orElseThrow(() -> new IllegalArgumentException("발신자를 찾을 수 없습니다. UID: " + request.getSenderUid()));

        User receiver = userRepository.findById(request.getReceiverUid())
                .orElseThrow(() -> new IllegalArgumentException("수신자를 찾을 수 없습니다. UID: " + request.getReceiverUid()));

        Notification notification = new Notification();
        notification.setSender(sender);
        notification.setReceiver(receiver);
        notification.setTitle(request.getTitle());
        notification.setContent(request.getContent());
        notification.setRead(false);

        notificationRepository.save(notification);
    }

    // [woo] 현재 로그인 유저의 알림 목록 조회
    @Transactional(readOnly = true)
    public List<NotificationDTO.NotificationHistory> getMyNotifications(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return notificationRepository.findByReceiverOrderByCreateDateDesc(user)
                .stream()
                .map(NotificationDTO.NotificationHistory::new)
                .collect(Collectors.toList());
    }

    // [woo] 읽지 않은 알림 수 조회
    @Transactional(readOnly = true)
    public long getUnreadCount(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return notificationRepository.countByReceiverAndIsReadFalse(user);
    }

    // [woo] 특정 알림 읽음 처리
    public void markAsRead(Long notificationId, Long uid) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getReceiver().getUid().equals(uid)) {
            throw new IllegalArgumentException("본인의 알림만 읽을 수 있습니다.");
        }
        notification.setRead(true);
    }

    // [woo] 전체 알림 읽음 처리
    public void markAllAsRead(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        notificationRepository.findByReceiverOrderByCreateDateDesc(user)
                .forEach(n -> n.setRead(true));
    }
}