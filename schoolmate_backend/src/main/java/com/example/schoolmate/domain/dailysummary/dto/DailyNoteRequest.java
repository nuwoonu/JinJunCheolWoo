package com.example.schoolmate.domain.dailysummary.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;

// [woo] 교사 일일 태그 메모 저장 요청
@Getter
@NoArgsConstructor
public class DailyNoteRequest {
    private Long studentId;
    private LocalDate date;           // null이면 오늘
    private List<String> tags;        // 선택된 태그 목록
    private String memo;              // 직접 입력 메모 (선택)
}
