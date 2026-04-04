package com.example.schoolmate.domain.verification.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 이메일 발송 시도 로그
 * - 슬라이딩 윈도우 방식 rate limit 체크용
 * - 발송 시도마다 행을 추가하여 이력 보존
 */
@Entity
@Table(name = "email_send_attempt")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailSendAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    public EmailSendAttempt(String email) {
        this.email = email;
        this.sentAt = LocalDateTime.now();
    }
}
