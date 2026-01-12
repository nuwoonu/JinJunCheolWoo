package com.example.schoolmate.common.entity;

import com.example.schoolmate.common.entity.constant.TestType;

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
@Table(name = "user_grade")
@ToString(exclude = { "student", "subject" })
public class Grade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TestType testType; // 시험 종류

    @Column(nullable = false)
    private int semester; // 학기

    @Column(nullable = false)
    private Integer score; // 점수

    @ManyToOne
    @JoinColumn(name = "student_number")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "subject_id")
    private Subject subject;

    public void setStudent(Student student) {
        if (this.student != null) {
            this.student.getGrades().remove(this);
        }
        this.student = student;
        if (student != null && !student.getGrades().contains(this)) {
            student.getGrades().add(this);
        }
    }

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
