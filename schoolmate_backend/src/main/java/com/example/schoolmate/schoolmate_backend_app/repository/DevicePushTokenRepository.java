package com.example.schoolmate.schoolmate_backend_app.repository;

import com.example.schoolmate.schoolmate_backend_app.entity.DevicePushToken;
import com.example.schoolmate.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.Set;

// [woo] 디바이스 푸시 토큰 리포지토리 — APP에서 사용
public interface DevicePushTokenRepository extends JpaRepository<DevicePushToken, Long> {

    List<DevicePushToken> findByUser(User user);

    Optional<DevicePushToken> findByToken(String token);

    void deleteByToken(String token);

    // [woo] 여러 사용자의 토큰 한 번에 조회 (대량 푸시 발송용)
    @Query("SELECT d FROM DevicePushToken d WHERE d.user.uid IN :uids")
    List<DevicePushToken> findByUserUidIn(Set<Long> uids);
}
