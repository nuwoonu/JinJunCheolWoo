package com.example.schoolmate.domain.grade.entity;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.user.entity.constant.TestType;
import com.example.schoolmate.domain.term.entity.AcademicTerm;

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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "grades")
@ToString(exclude = { "student", "subject", "academicTerm" })
public class Grade extends SchoolBaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TestType testType; // 시험 종류

    @Column(nullable = false)
    private Double score; // 점수

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id")
    private AcademicTerm academicTerm; // 학기 정보 (학년도 + 학기)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private StudentInfo student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public void setStudent(StudentInfo student) {
        this.student = student;
    }

    public void changeScore(Double score) {
        this.score = score;
    }

    // 하위 호환 편의 메서드
    public int getSchoolYear() {
        return academicTerm != null ? academicTerm.getSchoolYearInt() : 0;
    }

    public int getSemesterNum() {
        return academicTerm != null ? academicTerm.getSemester() : 0;
    }
}
