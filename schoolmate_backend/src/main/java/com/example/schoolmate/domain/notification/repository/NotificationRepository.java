package com.example.schoolmate.domain.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.schoolmate.domain.notification.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long>, NotificationRepositoryCustom {
}