package com.example.schoolmate.domain.quiz.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * [woo] 퀴즈 개별 답안 엔티티
 * - 객관식: selectedOption에 선택한 옵션 연결
 * - 단답형: answerText에 입력한 답 저장
 */
@Entity
@Table(name = "quiz_answer")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private QuizSubmission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    // [woo] 객관식: 선택한 옵션
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id")
    private QuizOption selectedOption;

    // [woo] 단답형: 입력한 답
    @Column(length = 500)
    private String answerText;

    // [woo] 이 답안이 정답인지
    @Builder.Default
    @Column(nullable = false)
    private boolean isCorrect = false;

    // [woo] 획득 점수
    @Builder.Default
    @Column(nullable = false)
    private int earnedPoints = 0;
}
