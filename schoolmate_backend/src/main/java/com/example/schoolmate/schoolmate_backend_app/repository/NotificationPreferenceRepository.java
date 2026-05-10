package com.example.schoolmate.schoolmate_backend_app.repository;

import com.example.schoolmate.schoolmate_backend_app.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;
import java.util.Set;

// [woo] 알림 설정 리포지토리 — APP 프로필 알림 설정, ExpoPushService 야간 체크용
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

    Optional<NotificationPreference> findByUserUid(Long uid);

    // [woo] 여러 사용자의 설정 한 번에 조회 (대량 푸시 시 야간 필터링용)
    @Query("SELECT np FROM NotificationPreference np WHERE np.user.uid IN :uids")
    List<NotificationPreference> findByUserUidIn(Set<Long> uids);
}
