package com.example.schoolmate.domain.user.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActivityCategory {
    AUTONOMOUS("자율활동"),
    CLUB("동아리활동"),
    VOLUNTEER("봉사활동"),
    CAREER("진로활동");

    private final String description;
}
