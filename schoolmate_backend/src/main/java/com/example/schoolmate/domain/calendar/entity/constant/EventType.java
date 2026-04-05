package com.example.schoolmate.domain.calendar.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EventType {
    ACADEMIC("학사일정", "#4e73df"), // Primary Blue
    HOLIDAY("공휴일", "#e74a3b"),   // Danger Red
    EXAM("시험", "#f6c23e"),        // Warning Yellow
    EVENT("행사", "#36b9cc"),       // Info Cyan
    VACATION("방학", "#0dcaf0"),    // Info Blue
    ETC("기타", "#858796");         // Secondary Gray

    private final String description;
    private final String color;
}