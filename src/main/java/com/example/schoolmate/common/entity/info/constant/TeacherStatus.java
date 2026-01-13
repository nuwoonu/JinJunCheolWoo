package com.example.schoolmate.common.entity.info.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TeacherStatus {
    EMPLOYED("재직"),
    LEAVE("휴직"),
    RETIRED("퇴직");

    private final String description;
}
