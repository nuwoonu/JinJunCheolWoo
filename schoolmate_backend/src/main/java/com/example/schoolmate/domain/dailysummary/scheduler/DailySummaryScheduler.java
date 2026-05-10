package com.example.schoolmate.domain.dailysummary.scheduler;

// [woo] 평일 오후 5시 자동 실행 - 전체 학생 하루 요약 생성 + 학부모 FCM 푸시
// 하교 시간 이후 실행하여 당일 출결/과제/퀴즈 데이터가 모두 입력된 상태에서 요약
// [woo] 현재 @Scheduled 주석 처리 - 운영 안정화 전까지 자동 실행 중단

import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.schoolmate.domain.dailysummary.service.DailySummaryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailySummaryScheduler {

    private final DailySummaryService dailySummaryService;

    // [woo] 평일 오후 5시 자동 실행 (월~금) - 서버 시간 기준
    // [woo] 임시 비활성화: 풀려면 아래 @Scheduled 라인 주석만 해제
    // @Scheduled(cron = "0 0 17 * * MON-FRI")
    public void runDailySummary() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        log.info("[woo] 하루 요약 스케줄러 시작: {}", today);
        dailySummaryService.generateAllSummaries(today);
    }
}
