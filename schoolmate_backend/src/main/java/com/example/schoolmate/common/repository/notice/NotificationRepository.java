package com.example.schoolmate.common.repository.notice;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.schoolmate.common.entity.notification.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long>, NotificationRepositoryCustom {
}