package com.example.schoolmate.domain.library.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.domain.library.entity.constant.BookCategory;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

/**
 * 도서 엔티티
 *
 * 학교별로 보관된 도서 정보를 관리합니다.
 * - 학교 격리는 SchoolBaseEntity를 통해 처리됩니다.
 * - 동일 학교 내에서 동일 ISBN은 1권만 등록 가능합니다. (같은 책이 여러 권 필요한 경우 totalCopies 사용)
 */
@Entity
@Table(name = "books", uniqueConstraints = {
        @UniqueConstraint(name = "uk_book_school_isbn", columnNames = { "school_id", "isbn" })
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "loans", "reviews" })
public class Book extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 200)
    private String author;

    @Column(length = 200)
    private String publisher;

    @Column(name = "publish_date")
    private LocalDate publishDate;

    @Column(length = 20)
    private String isbn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookCategory category;

    private Integer pages;

    @Column(length = 30)
    private String language;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "author_bio", columnDefinition = "TEXT")
    private String authorBio;

    /** 쉼표(,)로 구분된 태그 문자열 (예: "성장,청소년,고전") */
    @Column(length = 500)
    private String tags;

    /** 표지 이미지 URL */
    @Column(name = "cover_image", length = 1000)
    private String coverImage;

    /** 총 보유 권수 */
    @Column(name = "total_copies", nullable = false)
    @Builder.Default
    private Integer totalCopies = 1;

    /** 누적 대출 횟수 (통계용) */
    @Column(name = "borrow_count", nullable = false)
    @Builder.Default
    private Long borrowCount = 0L;

    /** 소프트 삭제 플래그 */
    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    @OneToMany(mappedBy = "book")
    @Builder.Default
    private List<BookLoan> loans = new ArrayList<>();

    @OneToMany(mappedBy = "book")
    @Builder.Default
    private List<BookReview> reviews = new ArrayList<>();

    /** 누적 대출 횟수 증가 */
    public void increaseBorrowCount() {
        this.borrowCount = (this.borrowCount == null ? 0L : this.borrowCount) + 1L;
    }

    /** 프론트 표기용: "800 문학" */
    public String getCategoryDisplayName() {
        return category != null ? category.getDisplayName() : null;
    }
}
