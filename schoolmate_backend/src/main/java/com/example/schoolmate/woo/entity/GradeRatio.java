package com.example.schoolmate.woo.entity;

import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;

import jakarta.persistence.*;
import lombok.*;

// [woo] 성적 비율 설정 (학급+과목+학기+학년도 단위)
@Entity
@Table(name = "grade_ratio", uniqueConstraints = {
        @UniqueConstraint(name = "uk_grade_ratio",
                columnNames = {"classroom_id", "subject_id", "semester", "school_year"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeRatio extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @Column(nullable = false)
    private int midtermRatio;   // 중간고사 비율 (0~100)

    @Column(nullable = false)
    private int finalRatio;     // 기말고사 비율 (0~100)

    @Column(nullable = false)
    private int homeworkRatio;  // 과제 비율 (0~100)

    @Column(nullable = false)
    private int quizRatio;      // 퀴즈 비율 (0~100)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_teacher_id")
    private TeacherInfo setTeacher;

    public boolean isValidRatio() {
        return midtermRatio + finalRatio + homeworkRatio + quizRatio == 100;
    }
}
