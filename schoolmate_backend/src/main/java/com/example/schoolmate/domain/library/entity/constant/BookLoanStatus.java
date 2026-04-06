package com.example.schoolmate.domain.library.entity.constant;

import lombok.Getter;

/**
 * 도서 대출 상태
 */
@Getter
public enum BookLoanStatus {
    BORROWED("대출중"),
    RETURNED("반납완료"),
    OVERDUE("연체");

    private final String label;

    BookLoanStatus(String label) {
        this.label = label;
    }
}
