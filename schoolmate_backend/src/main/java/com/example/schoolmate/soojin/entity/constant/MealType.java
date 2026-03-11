package com.example.schoolmate.soojin.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum MealType {

    BREAKFAST("조식"),
    LUNCH("중식"),
    DINNER("석식");

    private final String description;

}
