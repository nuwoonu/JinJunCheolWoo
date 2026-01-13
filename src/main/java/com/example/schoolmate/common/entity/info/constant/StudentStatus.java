package com.example.schoolmate.common.entity.info.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StudentStatus {
    ENROLLED("재학"),
    LEAVE_OF_ABSENCE("휴학"),
    DROPOUT("자퇴"),
    EXPELLED("제적"),
    GRADUATED("졸업"),
    TRANSFERRED("전학");

    private final String description;
}