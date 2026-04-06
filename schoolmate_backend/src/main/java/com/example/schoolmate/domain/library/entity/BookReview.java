package com.example.schoolmate.domain.library.entity;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.student.entity.StudentInfo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
 * 도서 리뷰(평점) 엔티티
 *
 * - 한 학생은 한 도서에 대해 하나의 리뷰만 작성 가능
 * - 평점: 1 ~ 5
 */
@Entity
@Table(name = "book_reviews", uniqueConstraints = {
        @UniqueConstraint(name = "uk_book_review_student", columnNames = { "book_id", "student_info_id" })
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "book", "studentInfo" })
public class BookReview extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo studentInfo;

    /** 평점: 1 ~ 5 */
    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String content;

    /** 평점/내용 수정 */
    public void update(Integer rating, String content) {
        if (rating != null) {
            this.rating = rating;
        }
        this.content = content;
    }
}
