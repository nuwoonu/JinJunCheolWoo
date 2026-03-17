package com.example.schoolmate.homework.entity;

/**
 * [woo] 과제 상태 enum
 * OPEN: 진행중 (마감일 전, 제출 가능)
 * CLOSED: 마감됨 (마감일 후, 제출 불가)
 * GRADED: 채점 완료
 */
public enum HomeworkStatus {
    OPEN,
    CLOSED,
    GRADED
}
