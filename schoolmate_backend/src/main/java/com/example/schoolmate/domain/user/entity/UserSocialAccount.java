package com.example.schoolmate.domain.user.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 소셜 로그인 연동 계정 테이블
 * - 한 유저가 여러 소셜 계정을 연동할 수 있도록 별도 테이블로 분리
 * - (provider, providerId) 조합이 전역 고유값 (UNIQUE 제약)
 */
@Entity
@Table(
    name = "user_social_account",
    uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserSocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    private String provider; // "google", "kakao"

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    @Column(name = "provider_email")
    private String providerEmail; // 소셜 계정의 이메일 (계정 primary 이메일과 다를 수 있음)

    @Column(name = "linked_at", nullable = false)
    private LocalDateTime linkedAt;

    public static UserSocialAccount of(User user, String provider, String providerId, String providerEmail) {
        UserSocialAccount sa = new UserSocialAccount();
        sa.user = user;
        sa.provider = provider;
        sa.providerId = providerId;
        sa.providerEmail = providerEmail;
        sa.linkedAt = LocalDateTime.now();
        return sa;
    }
}
