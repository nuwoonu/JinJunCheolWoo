package com.example.schoolmate.common.entity.info.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StudentStatus {
    PENDING("승인대기"),
    ENROLLED("재학"),
    LEAVE_OF_ABSENCE("휴학"),
    DROPOUT("자퇴"),
    EXPELLED("제적"),
    GRADUATED("졸업"),
    TRANSFERRED("전학");

    private final String description;

    // 현재 학교 소속인지 확인 (재학생, 휴학생)
    public boolean isCurrentStudent() {
        return this == ENROLLED || this == LEAVE_OF_ABSENCE;
    }
}