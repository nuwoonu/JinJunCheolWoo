package com.example.schoolmate.soojin.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum MealTargetType {
    ALL("전체"), // 학생 + 교직원 공통
    STUDENT("학생"), // 학생만
    STAFF("교직원"); // 교직원만

    private final String description;
}
