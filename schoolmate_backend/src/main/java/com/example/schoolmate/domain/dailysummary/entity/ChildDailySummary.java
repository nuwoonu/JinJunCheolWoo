package com.example.schoolmate.domain.dailysummary.entity;

// [woo] GPT가 생성한 자녀 하루 요약 - 매일 오후 4시 스케줄러가 자동 생성
// 학부모 앱에서 조회, FCM 푸시로 알림

import java.time.LocalDate;

import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "child_daily_summary",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_info_id", "summary_date"}),
        indexes = @Index(name = "idx_summary_student_date", columnList = "student_info_id, summary_date"))
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChildDailySummary extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo student;

    @Column(nullable = false)
    private LocalDate summaryDate;

    // [woo] GPT가 생성한 학부모용 요약문
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // [woo] FCM 푸시 전송 여부
    @Builder.Default
    private boolean pushed = false;

    public void markPushed() {
        this.pushed = true;
    }
}
