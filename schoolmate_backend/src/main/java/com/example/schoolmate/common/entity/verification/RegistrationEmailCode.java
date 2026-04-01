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
 * 회원가입 이메일 인증 코드 임시 저장 테이블
 * - email을 PK로 사용 → save() 시 기존 코드 자동 덮어씀 (upsert)
 * - 인증 완료(verified=true) 후 회원가입 시 소비·삭제됨
 */
@Entity
@Table(name = "registration_email_code")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RegistrationEmailCode {

    @Id
    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean verified = false;

    public static RegistrationEmailCode issue(String email, String code, int expiryMinutes) {
        RegistrationEmailCode rec = new RegistrationEmailCode();
        rec.email = email;
        rec.code = code;
        rec.expiresAt = LocalDateTime.now().plusMinutes(expiryMinutes);
        rec.verified = false;
        return rec;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean matches(String inputCode) {
        return this.code.equals(inputCode);
    }

    public void markVerified() {
        this.verified = true;
    }
}
