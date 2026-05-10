package com.example.schoolmate.schoolmate_backend_app.entity;

import com.example.schoolmate.domain.user.entity.User;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// [woo] Expo 푸시 토큰 저장 엔티티 — APP에서 로그인 시 POST /api/push/register로 토큰 등록
// 사용자당 여러 디바이스(토큰) 보유 가능, ExpoPushService가 이 토큰으로 실제 푸시 전송
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = "token"))
@Getter
@Setter
@NoArgsConstructor
public class DevicePushToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @Column(nullable = false, length = 300)
    private String token; // ExponentPushToken[xxxx]

    @Column(length = 20)
    private String platform; // "ios" | "android"

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
