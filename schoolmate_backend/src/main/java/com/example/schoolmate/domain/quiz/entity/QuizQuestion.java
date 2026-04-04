package com.example.schoolmate.domain.quiz.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.global.entity.BaseEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

/**
 * [woo] 퀴즈 문제 엔티티
 * - 객관식: QuizOption으로 선택지 관리
 * - 단답형: correctAnswer에 정답 저장 (쉼표 구분으로 복수 정답 허용)
 */
@Entity
@Table(name = "quiz_question")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    // [woo] 문제 내용
    @Column(nullable = false, length = 2000)
    private String questionText;

    // [woo] 문제 순서 (1번, 2번...)
    @Column(nullable = false)
    private int questionOrder;

    // [woo] 배점
    @Builder.Default
    @Column(nullable = false)
    private int points = 1;

    // [woo] 문제 유형
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType questionType;

    // [woo] 단답형 정답 (쉼표 구분으로 복수 정답 허용, 예: "르네상스,Renaissance")
    @Column(length = 1000)
    private String correctAnswer;

    // [woo] 객관식 선택지 목록
    @Builder.Default
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("optionOrder ASC")
    private List<QuizOption> options = new ArrayList<>();

    // ========== 편의 메서드 ==========

    // [woo] 단답형 정답 검증 (공백 제거, 대소문자 무시)
    public boolean checkShortAnswer(String answer) {
        if (correctAnswer == null || answer == null) return false;
        String trimmed = answer.trim();
        for (String correct : correctAnswer.split(",")) {
            if (correct.trim().equalsIgnoreCase(trimmed)) {
                return true;
            }
        }
        return false;
    }
}
