package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.constant.TestType;
import com.example.schoolmate.common.entity.user.constant.Year;

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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "grades")
@ToString(exclude = { "student", "subject" })
public class Grade extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TestType testType; // 시험 종류

    @Column(nullable = false)
    private int semester; // 학기

    @Column(nullable = false)
    private Integer score; // 점수

    @Enumerated(EnumType.STRING)
    private Year year; // 학년

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private StudentInfo student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    // 양방향 연관관계 편의 메서드 추가
    // 학생 설정 편의 메서드
    public void setStudent(StudentInfo student) {
        // 기존 관계 제거
        if (this.student != null) {
            this.student.getGrades().remove(this);
        }
        this.student = student;
        // 새 관계 추가
        if (student != null && !student.getGrades().contains(this)) {
            student.getGrades().add(this);
        }
    }

    // 과목 설정 편의 메서드
    public void setSubject(Subject subject) {
        if (this.subject != null) {
            this.subject.getGrades().remove(this);
        }
        this.subject = subject;
        if (subject != null && !subject.getGrades().contains(this)) {
            subject.getGrades().add(this);
        }
    }

    public void changeScore(Integer score) {
        this.score = score;
    }
}
