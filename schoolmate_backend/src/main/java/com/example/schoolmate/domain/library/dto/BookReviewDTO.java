package com.example.schoolmate.domain.library.dto;

import java.time.LocalDateTime;

import com.example.schoolmate.domain.library.entity.BookReview;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 도서 리뷰 DTO 통합 클래스
 */
public class BookReviewDTO {

    // ========== 생성/수정 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpsertRequest {
        @NotNull(message = "평점은 필수입니다")
        @Min(value = 1, message = "평점은 1 이상이어야 합니다")
        @Max(value = 5, message = "평점은 5 이하여야 합니다")
        private Integer rating;

        private String content;
    }

    // ========== 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long bookId;
        private Long studentInfoId;
        private String studentName;
        private Integer rating;
        private String content;
        private LocalDateTime createDate;
        private LocalDateTime updateDate;

        public static Response fromEntity(BookReview review) {
            String studentName = null;
            if (review.getStudentInfo() != null && review.getStudentInfo().getUser() != null) {
                studentName = review.getStudentInfo().getUser().getName();
            }
            return Response.builder()
                    .id(review.getId())
                    .bookId(review.getBook() != null ? review.getBook().getId() : null)
                    .studentInfoId(review.getStudentInfo() != null ? review.getStudentInfo().getId() : null)
                    .studentName(studentName)
                    .rating(review.getRating())
                    .content(review.getContent())
                    .createDate(review.getCreateDate())
                    .updateDate(review.getUpdateDate())
                    .build();
        }
    }
}
