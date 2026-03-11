package com.example.schoolmate.common.entity.user.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Year {
    FIRST("1학년"),
    SECOND("2학년"),
    THIRD("3학년");

    private final String description;
}
