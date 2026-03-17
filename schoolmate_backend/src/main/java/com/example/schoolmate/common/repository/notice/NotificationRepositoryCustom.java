package com.example.schoolmate.common.repository.notice;

import java.util.List;

import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;

public interface NotificationRepositoryCustom {
    /** 논리 삭제되지 않은 수신자의 알림 목록 (최신순) */
    List<Notification> findActiveByReceiver(User receiver);

    /** 논리 삭제되지 않은 수신자의 읽지 않은 알림 수 */
    long countUnreadActiveByReceiver(User receiver);
}
