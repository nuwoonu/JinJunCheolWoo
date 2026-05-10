package com.example.schoolmate.domain.dailysummary.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

// [woo] 하루 요약 응답 DTO 모음
public class DailySummaryResponse {

    // 교사용: 담임반 학생별 오늘 메모 입력 현황
    @Getter
    @Builder
    public static class StudentNoteStatus {
        private Long studentId;
        private String studentName;
        private List<String> tags;
        private String memo;
        private boolean hasNote;       // 오늘 메모 입력 여부 (UI에서 완료 표시)
    }

    // 학부모용: 하루 요약 단건
    @Getter
    @Builder
    public static class Summary {
        private Long id;
        private Long studentId;
        private LocalDate summaryDate;
        private String content;
    }
}
