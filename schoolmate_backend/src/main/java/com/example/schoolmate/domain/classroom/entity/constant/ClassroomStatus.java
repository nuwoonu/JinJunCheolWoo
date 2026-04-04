package com.example.schoolmate.domain.classroom.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClassroomStatus {
    ACTIVE("운영"),
    FINISHED("종료");

    private final String description;
}