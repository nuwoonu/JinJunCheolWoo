package com.example.schoolmate.domain.verification.service;

import java.security.SecureRandom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.verification.entity.RegistrationEmailCode;
import com.example.schoolmate.domain.verification.repository.RegistrationEmailCodeRepository;
import com.example.schoolmate.domain.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegistrationVerificationService {

    private final RegistrationEmailCodeRepository codeRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final EmailRateLimitService emailRateLimitService;

    @Value("${app.verification.code-expiry-minutes:5}")
    private int expiryMinutes;

    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * 인증 코드 발송 — 이미 가입된 이메일이면 거부
     */
    @Transactional
    public void sendCode(String email) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        emailRateLimitService.checkAndRecord(email);
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        RegistrationEmailCode rec = RegistrationEmailCode.issue(email, code, expiryMinutes);
        codeRepository.save(rec); // 재발송 시 upsert로 코드 교체
        emailService.sendRegistrationVerificationCode(email, code);
        log.info("회원가입 이메일 인증 코드 발송: {}", email);
    }

    /**
     * 코드 검증 → 성공 시 verified=true 로 표시
     */
    @Transactional
    public void verifyCode(String email, String code) {
        RegistrationEmailCode rec = codeRepository.findById(email)
                .orElseThrow(() -> new IllegalStateException("인증 코드가 없습니다. 코드를 다시 발송해주세요."));

        if (rec.isExpired()) {
            codeRepository.delete(rec);
            throw new IllegalStateException("인증 코드가 만료되었습니다. 코드를 다시 발송해주세요.");
        }

        if (!rec.matches(code)) {
            throw new IllegalStateException("인증 코드가 일치하지 않습니다.");
        }

        rec.markVerified();
        codeRepository.save(rec);
        log.info("회원가입 이메일 인증 완료: {}", email);
    }

    /**
     * 회원가입 완료 시 인증 여부 확인 후 레코드 소비(삭제)
     * 인증되지 않았으면 예외를 던짐
     */
    @Transactional
    public void checkAndConsume(String email) {
        RegistrationEmailCode rec = codeRepository.findById(email).orElse(null);
        if (rec == null || !rec.isVerified() || rec.isExpired()) {
            throw new IllegalStateException("이메일 인증이 완료되지 않았습니다.");
        }
        codeRepository.delete(rec);
        log.info("회원가입 이메일 인증 레코드 소비: {}", email);
    }
}
