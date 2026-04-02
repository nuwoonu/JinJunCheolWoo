package com.example.schoolmate.common.entity.notification;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "push_subscription")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PushSubscription extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid", nullable = false)
    private User user;

    // 브라우저가 발급한 Push 엔드포인트 URL (FCM 등)
    @Column(length = 1000, nullable = false)
    private String endpoint;

    // 수신자의 EC 공개키 (base64url)
    @Column(length = 500, nullable = false)
    private String p256dhKey;

    // 인증 비밀키 (base64url)
    @Column(length = 200, nullable = false)
    private String authKey;
}
