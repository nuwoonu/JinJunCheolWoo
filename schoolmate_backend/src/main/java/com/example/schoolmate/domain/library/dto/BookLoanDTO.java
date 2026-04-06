package com.example.schoolmate.domain.library.dto;

import java.time.LocalDate;

import com.example.schoolmate.domain.library.entity.BookLoan;
import com.example.schoolmate.domain.library.entity.constant.BookLoanStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 도서 대출 DTO 통합 클래스
 */
public class BookLoanDTO {

    // ========== 대출 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BorrowRequest {
        @NotNull(message = "도서 ID는 필수입니다")
        private Long bookId;
    }

    // ========== 응답 (대출중/연체/이력 공통) ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long bookId;
        private String title;
        private String author;
        private String category;
        private String coverImage;
        private String isbn;
        private LocalDate borrowDate;
        private LocalDate dueDate;
        private LocalDate returnDate;
        private Integer extensionCount;
        private BookLoanStatus status;
        /** 남은 기간(일). 연체면 음수 */
        private Long remainingDays;
        /** 연체 일수(연체 시만). 연체가 아니면 0 */
        private Long overdueDays;

        public static Response fromEntity(BookLoan loan, LocalDate today) {
            long remaining = loan.remainingDays(today);
            long overdue = 0L;
            if (loan.getStatus() == BookLoanStatus.OVERDUE
                    || (loan.getStatus() == BookLoanStatus.BORROWED && remaining < 0)) {
                overdue = Math.max(0L, -remaining);
            }
            return Response.builder()
                    .id(loan.getId())
                    .bookId(loan.getBook().getId())
                    .title(loan.getBook().getTitle())
                    .author(loan.getBook().getAuthor())
                    .category(loan.getBook().getCategoryDisplayName())
                    .coverImage(loan.getBook().getCoverImage())
                    .isbn(loan.getBook().getIsbn())
                    .borrowDate(loan.getBorrowDate())
                    .dueDate(loan.getDueDate())
                    .returnDate(loan.getReturnDate())
                    .extensionCount(loan.getExtensionCount())
                    .status(loan.getStatus())
                    .remainingDays(remaining)
                    .overdueDays(overdue)
                    .build();
        }
    }
}
