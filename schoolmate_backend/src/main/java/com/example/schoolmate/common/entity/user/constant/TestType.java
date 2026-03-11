package com.example.schoolmate.common.entity.user.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TestType {
    MIDTERMTEST("중간고사"),
    FINALTEST("기말고사"),
    PERFORMANCEASSESSMENT("수행평가");

    private final String description;
}
