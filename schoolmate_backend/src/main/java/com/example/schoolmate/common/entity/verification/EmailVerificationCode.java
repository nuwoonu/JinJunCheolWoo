package com.example.schoolmate.common.entity.verification;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 이메일 인증 코드 임시 저장 테이블
 * - userId를 PK로 사용 → save() 호출 시 기존 코드를 자동으로 덮어씀 (upsert)
 * - 인증 성공 또는 재발송 시 삭제/교체됨
 */
@Entity
@Table(name = "email_verification_code")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailVerificationCode {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    public static EmailVerificationCode issue(Long userId, String code, int expiryMinutes) {
        EmailVerificationCode v = new EmailVerificationCode();
        v.userId = userId;
        v.code = code;
        v.expiresAt = LocalDateTime.now().plusMinutes(expiryMinutes);
        return v;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean matches(String inputCode) {
        return this.code.equals(inputCode);
    }
}
