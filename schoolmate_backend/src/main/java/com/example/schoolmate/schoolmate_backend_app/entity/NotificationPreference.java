package com.example.schoolmate.schoolmate_backend_app.entity;

import com.example.schoolmate.domain.user.entity.User;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

// [woo] 사용자별 알림 설정 — APP 프로필 > 알림 설정에서 변경
// quietHoursEnabled=true이면 quietStart~quietEnd 사이 푸시 발송 차단 (KST 기준)
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = "user_uid"))
@Getter
@Setter
@NoArgsConstructor
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    // [woo] 푸시 알림 전체 on/off
    private boolean pushEnabled = true;

    // [woo] 야간 방해금지 모드
    private boolean quietHoursEnabled = false;

    // [woo] 방해금지 시작/종료 (기본 22:00~06:00)
    private LocalTime quietStart = LocalTime.of(22, 0);

    private LocalTime quietEnd = LocalTime.of(6, 0);
}
