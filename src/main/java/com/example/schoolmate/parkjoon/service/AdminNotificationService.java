package com.example.schoolmate.parkjoon.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.NotificationDTO;
import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.NotificationRepository;
import com.example.schoolmate.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminNotificationService {

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