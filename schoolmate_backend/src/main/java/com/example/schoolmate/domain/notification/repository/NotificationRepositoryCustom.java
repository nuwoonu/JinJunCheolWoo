package com.example.schoolmate.domain.notification.repository;

import java.util.List;

import com.example.schoolmate.domain.notification.entity.Notification;
import com.example.schoolmate.domain.user.entity.User;

public interface NotificationRepositoryCustom {
    /** 논리 삭제되지 않은 수신자의 알림 목록 (최신순) */
    List<Notification> findActiveByReceiver(User receiver);

    /** 논리 삭제되지 않은 수신자의 읽지 않은 알림 수 */
    long countUnreadActiveByReceiver(User receiver);
}
