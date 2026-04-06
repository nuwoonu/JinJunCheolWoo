package com.example.schoolmate.domain.dormitory.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum RoomType {
    SINGLE("1인실"),
    DOUBLE("2인실"),
    QUADRUPLE("4인실");

    private final String description;
}
