package com.example.schoolmate.common.entity.user.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Semester {
    FRIST("1학기"), FALL("2학기");

    private final String description;

}
