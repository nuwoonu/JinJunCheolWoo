package com.example.schoolmate.domain.quiz.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.global.entity.BaseEntity;
import com.example.schoolmate.domain.student.entity.StudentInfo;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * [woo] 퀴즈 응시 결과 엔티티
 * - 학생이 퀴즈를 제출할 때마다 생성
 * - attemptNumber로 몇 번째 응시인지 추적
 */
@Entity
@Table(name = "quiz_submission", indexes = {
        @Index(name = "idx_quiz_sub_quiz", columnList = "quiz_id"),
        @Index(name = "idx_quiz_sub_student", columnList = "student_info_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo student;

    // [woo] 획득 점수
    @Column(nullable = false)
    private int score;

    // [woo] 총 배점
    @Column(nullable = false)
    private int totalPoints;

    // [woo] 몇 번째 응시인지
    @Column(nullable = false)
    private int attemptNumber;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    // [woo] 개별 답안 목록
    @Builder.Default
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuizAnswer> answers = new ArrayList<>();
}
