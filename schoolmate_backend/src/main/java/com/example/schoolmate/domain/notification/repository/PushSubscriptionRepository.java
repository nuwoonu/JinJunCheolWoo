package com.example.schoolmate.domain.notification.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.notification.entity.PushSubscription;
import com.example.schoolmate.domain.user.entity.User;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    // User 객체 대신 uid(Long)로 조회 → auto-flush 시 transient User 문제 방지
    List<PushSubscription> findByUserUid(Long uid);

    Optional<PushSubscription> findByUserAndEndpoint(User user, String endpoint);

    void deleteByUserAndEndpoint(User user, String endpoint);
}
