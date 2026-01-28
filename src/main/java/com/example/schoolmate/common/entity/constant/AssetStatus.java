package com.example.schoolmate.common.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AssetStatus {
    AVAILABLE("사용 가능"),
    IN_USE("대여중"),
    BROKEN("수리중/파손"),
    LOST("분실/폐기");

    private final String description;
}
