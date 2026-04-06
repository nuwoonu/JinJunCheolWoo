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
 * [woo] 객관식 선택지 엔티티
 */
@Entity
@Table(name = "quiz_option")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    // [woo] 선택지 내용
    @Column(nullable = false, length = 1000)
    private String optionText;

    // [woo] 선택지 순서 (1번, 2번...)
    @Column(nullable = false)
    private int optionOrder;

    // [woo] 정답 여부
    @Builder.Default
    @Column(nullable = false)
    private boolean isCorrect = false;
}
