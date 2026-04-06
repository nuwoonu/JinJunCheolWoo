package com.example.schoolmate.quiz.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.term.entity.CourseSection;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * [woo] 퀴즈 엔티티
 * - 교사가 특정 학급에 퀴즈를 출제
 * - 객관식 / 단답형 문제 지원
 * - 자동 채점
 */
@Entity
@Table(name = "quiz", indexes = {
        @Index(name = "idx_quiz_classroom", columnList = "classroom_id"),
        @Index(name = "idx_quiz_teacher", columnList = "teacher_info_id")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Quiz extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    // [woo] 주차 (1주차, 2주차 등)
    private Integer week;

    // [woo] 출제 교사
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_info_id", nullable = false)
    private TeacherInfo teacher;

    // [woo] 대상 학급
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    // [woo] 수업 분반 (과목+학급 구분용, nullable → 기존 데이터 호환)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_section_id")
    private CourseSection courseSection;

    // [woo] 마감일
    @Column(nullable = false)
    private LocalDateTime dueDate;

    // [woo] 퀴즈 상태
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuizStatus status = QuizStatus.OPEN;

    // [woo] 응시 횟수 제한 (null이면 무제한)
    private Integer maxAttempts;

    // [woo] 제출 후 정답 공개 여부
    @Builder.Default
    @Column(nullable = false)
    private boolean showAnswer = true;

    // [woo] soft delete
    @Builder.Default
    @Column(nullable = false)
    private boolean isDeleted = false;

    // [woo] 문제 목록
    @Builder.Default
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("questionOrder ASC")
    private List<QuizQuestion> questions = new ArrayList<>();

    // [woo] 응시 결과 목록
    @Builder.Default
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuizSubmission> submissions = new ArrayList<>();

    // ========== 편의 메서드 ==========

    public void delete() {
        this.isDeleted = true;
    }

    public boolean isOverdue() {
        return LocalDateTime.now().isAfter(dueDate);
    }

    // [woo] 총 배점 합계
    public int getTotalPoints() {
        return questions.stream().mapToInt(QuizQuestion::getPoints).sum();
    }

    public enum QuizStatus {
        OPEN,    // 진행중
        CLOSED   // 마감
    }
}
