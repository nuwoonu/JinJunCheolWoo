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
    OTHER("기타");

    private final String description;
}
