package com.example.schoolmate.woo.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RepeatType {
    WEEKLY("매주"),
    BIWEEKLY("격주"),
    ONCE("일회성");

    private final String description;
}
