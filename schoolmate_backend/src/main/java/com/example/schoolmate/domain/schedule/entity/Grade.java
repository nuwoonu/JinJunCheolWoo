package com.example.schoolmate.woo.entity;

import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.constant.TestType;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.term.entity.AcademicTerm;

import jakarta.persistence.*;
import lombok.*;

// [woo] 시험 성적 엔티티 (중간고사 / 기말고사)
@Entity
@Table(name = "grades",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"student_id", "subject_id", "academic_term_id", "test_type"}))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grade extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentInfo student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id", nullable = false)
    private AcademicTerm academicTerm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TestType testType;

    @Column(nullable = false)
    private Double score;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "input_teacher_id")
    private TeacherInfo inputTeacher;

    public void changeScore(Double score) {
        this.score = score;
    }
}
