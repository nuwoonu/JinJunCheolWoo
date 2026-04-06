package com.example.schoolmate.domain.library.dto;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.example.schoolmate.domain.library.entity.Book;
import com.example.schoolmate.domain.library.entity.constant.BookCategory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 도서 DTO 통합 클래스
 */
public class BookDTO {

    // ========== 생성 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "제목은 필수입니다")
        private String title;

        @NotBlank(message = "저자는 필수입니다")
        private String author;

        private String publisher;
        private LocalDate publishDate;
        private String isbn;

        @NotNull(message = "카테고리는 필수입니다")
        private BookCategory category;

        private Integer pages;
        private String language;
        private String description;
        private String summary;
        private String authorBio;
        /** 쉼표로 구분된 태그 */
        private String tags;
        private String coverImage;

        @Min(value = 1, message = "최소 1권 이상이어야 합니다")
        private Integer totalCopies;
    }

    // ========== 수정 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String title;
        private String author;
        private String publisher;
        private LocalDate publishDate;
        private String isbn;
        private BookCategory category;
        private Integer pages;
        private String language;
        private String description;
        private String summary;
        private String authorBio;
        private String tags;
        private String coverImage;
        private Integer totalCopies;
    }

    // ========== 목록 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private Long id;
        private String title;
        private String author;
        /** 프론트 표기: "800 문학" */
        private String category;
        private String isbn;
        private String coverImage;
        private String description;
        private Integer totalCopies;
        private Long availableCopies;
        private Long borrowCount;
        /** 평균 평점 (없으면 0.0) */
        private Double rating;
        /** 대출 가능 여부 */
        private Boolean available;

        public static ListResponse fromEntity(Book book, long activeLoans, Double averageRating) {
            long available = Math.max(0L, (book.getTotalCopies() == null ? 0L : book.getTotalCopies()) - activeLoans);
            return ListResponse.builder()
                    .id(book.getId())
                    .title(book.getTitle())
                    .author(book.getAuthor())
                    .category(book.getCategoryDisplayName())
                    .isbn(book.getIsbn())
                    .coverImage(book.getCoverImage())
                    .description(book.getDescription())
                    .totalCopies(book.getTotalCopies())
                    .availableCopies(available)
                    .borrowCount(book.getBorrowCount())
                    .rating(averageRating != null ? averageRating : 0.0)
                    .available(available > 0)
                    .build();
        }
    }

    // ========== 상세 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailResponse {
        private Long id;
        private String title;
        private String author;
        private String publisher;
        private LocalDate publishDate;
        private String isbn;
        private String category;
        private Integer pages;
        private String language;
        private String description;
        private String summary;
        private String authorBio;
        private List<String> tags;
        private String coverImage;
        private Integer totalCopies;
        private Long availableCopies;
        private Long borrowCount;
        private Double rating;
        private Long reviewCount;
        private Boolean available;

        public static DetailResponse fromEntity(Book book, long activeLoans, Double averageRating, long reviewCount) {
            long available = Math.max(0L, (book.getTotalCopies() == null ? 0L : book.getTotalCopies()) - activeLoans);
            List<String> tagList;
            if (book.getTags() == null || book.getTags().isBlank()) {
                tagList = Collections.emptyList();
            } else {
                tagList = Arrays.stream(book.getTags().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
            }
            return DetailResponse.builder()
                    .id(book.getId())
                    .title(book.getTitle())
                    .author(book.getAuthor())
                    .publisher(book.getPublisher())
                    .publishDate(book.getPublishDate())
                    .isbn(book.getIsbn())
                    .category(book.getCategoryDisplayName())
                    .pages(book.getPages())
                    .language(book.getLanguage())
                    .description(book.getDescription())
                    .summary(book.getSummary())
                    .authorBio(book.getAuthorBio())
                    .tags(tagList)
                    .coverImage(book.getCoverImage())
                    .totalCopies(book.getTotalCopies())
                    .availableCopies(available)
                    .borrowCount(book.getBorrowCount())
                    .rating(averageRating != null ? averageRating : 0.0)
                    .reviewCount(reviewCount)
                    .available(available > 0)
                    .build();
        }
    }
}
