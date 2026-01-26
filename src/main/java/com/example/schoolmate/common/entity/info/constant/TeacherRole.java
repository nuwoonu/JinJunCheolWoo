package com.example.schoolmate.common.entity.info.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 교사-학생 관계에서 교사의 역할 유형
 *
 * 한 학생에게 여러 교사가 다른 역할로 연결될 수 있음.
 * (예: 담임교사, 부담임, 교과담당 등)
 */
@Getter
@RequiredArgsConstructor
public enum TeacherRole {
    HOMEROOM("담임교사"),
    VICE_HOMEROOM("부담임"),
    SUBJECT("교과담당"),
    COUNSELOR("상담교사"),
    CLUB_ADVISOR("동아리담당");

    private final String description;
}
