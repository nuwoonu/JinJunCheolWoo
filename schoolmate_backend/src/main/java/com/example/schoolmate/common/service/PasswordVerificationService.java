package com.example.schoolmate.common.service;

import java.security.SecureRandom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.verification.EmailVerificationCode;
import com.example.schoolmate.common.repository.EmailVerificationCodeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordVerificationService {

    private final EmailVerificationCodeRepository codeRepository;
    private final EmailService emailService;

    @Value("${app.verification.code-expiry-minutes:5}")
    private int expiryMinutes;

    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * 인증 코드 생성 후 DB 저장(upsert) + 이메일 발송
     * userId가 PK이므로 재발송 시 자동으로 이전 코드를 덮어씀
     */
    @Transactional
    public void sendCode(User user) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        EmailVerificationCode verification = EmailVerificationCode.issue(user.getUid(), code, expiryMinutes);
        codeRepository.save(verification);
        emailService.sendPasswordVerificationCode(user.getEmail(), code);
        log.info("비밀번호 변경 인증 코드 저장 완료: userId={}", user.getUid());
    }

    /**
     * 회원 탈퇴용 인증 코드 생성 후 DB 저장(upsert) + 이메일 발송
     */
    @Transactional
    public void sendWithdrawalCode(User user) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        EmailVerificationCode verification = EmailVerificationCode.issue(user.getUid(), code, expiryMinutes);
        codeRepository.save(verification);
        emailService.sendWithdrawalVerificationCode(user.getEmail(), code);
        log.info("회원 탈퇴 인증 코드 저장 완료: userId={}", user.getUid());
    }

    /**
     * 이메일 로그인 연동용 인증 코드 생성 후 DB 저장(upsert) + 이메일 발송
     */
    @Transactional
    public void sendLinkEmailCode(User user) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        EmailVerificationCode verification = EmailVerificationCode.issue(user.getUid(), code, expiryMinutes);
        codeRepository.save(verification);
        emailService.sendLinkEmailVerificationCode(user.getEmail(), code);
        log.info("이메일 로그인 연동 인증 코드 저장 완료: userId={}", user.getUid());
    }

    /**
     * 코드 검증 후 삭제
     * 검증 실패 시 예외를 던지고 레코드는 유지 (재시도 허용)
     * 만료 시에는 레코드를 삭제하고 예외를 던짐
     */
    @Transactional
    public void verifyAndDelete(Long userId, String inputCode) {
        EmailVerificationCode verification = codeRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("인증 코드가 없습니다. 코드를 다시 발송해주세요."));

        if (verification.isExpired()) {
            codeRepository.delete(verification);
            throw new IllegalStateException("인증 코드가 만료되었습니다. 코드를 다시 발송해주세요.");
        }

        if (!verification.matches(inputCode)) {
            throw new IllegalStateException("인증 코드가 일치하지 않습니다.");
        }

        codeRepository.delete(verification);
        log.info("비밀번호 변경 인증 완료: userId={}", userId);
    }
}
