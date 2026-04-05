package com.example.schoolmate.domain.homework.entity;
import com.example.schoolmate.domain.parent.entity.FamilyRelation;

import java.time.LocalDateTime;

import com.example.schoolmate.global.entity.BaseEntity;
import com.example.schoolmate.domain.student.entity.StudentInfo;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * [woo] 과제 제출 엔티티
 * - 학생이 과제에 대해 제출하는 내용
 * - Homework(과제)와 StudentInfo(학생)를 연결
 * - 1인 1제출 (unique 제약: homework_id + student_info_id)
 * - 학부모는 FamilyRelation → StudentInfo → HomeworkSubmission 경로로 자녀 제출 여부 확인
 */
@Entity
@Table(name = "homework_submission",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"homework_id", "student_info_id"})
        },
        indexes = {
                @Index(name = "idx_submission_homework", columnList = "homework_id"),
                @Index(name = "idx_submission_student", columnList = "student_info_id")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeworkSubmission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // [woo] 어떤 과제에 대한 제출인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homework_id", nullable = false)
    private Homework homework;

    // [woo] 제출한 학생 - StudentInfo와 직접 연결
    // 학부모는 FamilyRelation → StudentInfo를 통해 이 제출 내역을 조회
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo student;

    // [woo] 제출 내용 (텍스트)
    @Column(length = 5000)
    private String content;

    // [woo] 학생 첨부파일 (제출물)
    private String attachmentUrl;

    // [woo] 원본 파일명
    private String attachmentOriginalName;

    // [woo] 제출 일시
    @Column(nullable = false)
    private LocalDateTime submittedAt;

    // [woo] 점수 (교사가 채점)
    private Integer score;

    // [woo] 교사 피드백
    @Column(length = 2000)
    private String feedback;

    // [woo] 제출 상태
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;

    /**
     * [woo] 제출 상태 enum
     * SUBMITTED: 제출됨
     * LATE: 마감 후 제출 (지각 제출)
     * GRADED: 채점 완료
     */
    public enum SubmissionStatus {
        SUBMITTED,
        LATE,
        GRADED
    }

    // ========== 편의 메서드 ==========

    public void grade(Integer score, String feedback) {
        this.score = score;
        this.feedback = feedback;
        this.status = SubmissionStatus.GRADED;
    }
}
