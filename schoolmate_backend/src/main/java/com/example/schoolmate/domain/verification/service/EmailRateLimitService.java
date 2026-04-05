package com.example.schoolmate.domain.verification.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.verification.entity.EmailSendAttempt;
import com.example.schoolmate.domain.verification.repository.EmailSendAttemptRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 이메일 발송 rate limit 서비스 (슬라이딩 윈도우)
 *
 * - 발송 시도마다 email_send_attempt 테이블에 행 추가 (이력 보존)
 * - 최근 WINDOW_MINUTES 분 이내 시도 횟수가 MAX_ATTEMPTS 이상이면 예외
 * - REQUIRES_NEW: 외부 트랜잭션 롤백 여부와 무관하게 시도 이력 커밋
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailRateLimitService {

    private final EmailSendAttemptRepository attemptRepository;

    private static final int MAX_ATTEMPTS = 5;
    private static final int WINDOW_MINUTES = 5;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void checkAndRecord(String email) {
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(WINDOW_MINUTES);

        // 윈도우 밖 오래된 이력 정리 (lazy cleanup)
        attemptRepository.deleteOlderThan(windowStart);

        long recentCount = attemptRepository.countRecentAttempts(email, windowStart);
        if (recentCount >= MAX_ATTEMPTS) {
            log.warn("이메일 발송 rate limit 초과: email={}, 최근 {}분 내 {}회 시도", email, WINDOW_MINUTES, recentCount);
            throw new IllegalStateException(
                    WINDOW_MINUTES + "분 내 최대 " + MAX_ATTEMPTS + "회까지 요청할 수 있습니다. 잠시 후 다시 시도해주세요.");
        }

        attemptRepository.save(new EmailSendAttempt(email));
        log.debug("이메일 발송 시도 기록: email={}, 최근 {}분 내 {}회째", email, WINDOW_MINUTES, recentCount + 1);
    }
}
