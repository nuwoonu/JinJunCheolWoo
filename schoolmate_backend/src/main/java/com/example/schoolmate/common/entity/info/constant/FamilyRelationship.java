package com.example.schoolmate.common.entity.info.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FamilyRelationship {
    FATHER("부"),
    MOTHER("모"),
    GRANDFATHER("조부"),
    GRANDMOTHER("조모"),
    OTHER("기타");

    private final String description;
}
