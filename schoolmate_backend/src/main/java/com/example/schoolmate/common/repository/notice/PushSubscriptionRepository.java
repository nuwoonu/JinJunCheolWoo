package com.example.schoolmate.common.repository.notice;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.notification.PushSubscription;
import com.example.schoolmate.common.entity.user.User;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    // User 객체 대신 uid(Long)로 조회 → auto-flush 시 transient User 문제 방지
    List<PushSubscription> findByUserUid(Long uid);

    Optional<PushSubscription> findByUserAndEndpoint(User user, String endpoint);

    void deleteByUserAndEndpoint(User user, String endpoint);
}
