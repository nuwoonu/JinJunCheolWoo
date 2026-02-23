package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;
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

    @Enumerated(EnumType.STRING)
    private Semester semester; // 학기

    @Column(nullable = false)
    private Double score; // 점수

    @Enumerated(EnumType.STRING)
    private Year year; // 학년

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
}
