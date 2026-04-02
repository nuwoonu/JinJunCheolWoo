package com.example.schoolmate.woo.entity;

import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// [woo] 최종 성적 (비율 적용 합산)
@Entity
@Table(name = "final_grade", uniqueConstraints = {
        @UniqueConstraint(name = "uk_final_grade",
                columnNames = {"student_id", "classroom_id", "subject_id", "semester", "school_year"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalGrade extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentInfo student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Semester semester;

    @Column(name = "school_year", nullable = false)
    private int schoolYear;

    private Double midtermScore;    // 중간고사 점수 (0~100, null 가능)
    private Double finalExamScore;  // 기말고사 점수 (0~100, null 가능)
    private Double homeworkScore;   // 과제 환산 점수 (null 가능)
    private Double quizScore;       // 퀴즈 환산 점수 (null 가능)
    private Double totalScore;      // 비율 적용 최종 점수

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_ratio_id")
    private GradeRatio gradeRatio;

    @Column(nullable = false)
    private LocalDateTime calculatedAt;
}
