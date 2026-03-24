package com.example.schoolmate.domain.term.entity;

/**
 * 학기 상태
 *
 * ACTIVE : 현재 진행 중인 학기 (학교당 1개만 존재해야 함)
 * CLOSED : 종료된 학기 (역사 기록으로 보존)
 */
public enum AcademicTermStatus {
    ACTIVE,
    CLOSED
}
