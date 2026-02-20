package com.example.schoolmate.common.entity.user.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserRole {
    STUDENT("학생"),
    TEACHER("교사"),
    STAFF("교직원"),
    PARENT("학부모"),
    ADMIN("관리자"),
    FACILITY_MANAGER("시설 관리자"),
    ASSET_MANAGER("기자재 관리자"),
    LIBRARIAN("사서"),
    NURSE("보건 교사"),
    NUTRITIONIST("영양사");

    private final String description;
}
