package com.example.schoolmate.common.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.NotificationDTO;
import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.NotificationRepository;
import com.example.schoolmate.common.repository.UserRepository;

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
}