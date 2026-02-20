package com.example.schoolmate.common.repository.notice;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // 수신자 기준 최신순 조회
    List<Notification> findByReceiverOrderByCreateDateDesc(User receiver);
}