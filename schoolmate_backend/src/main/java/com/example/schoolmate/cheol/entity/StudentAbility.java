package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.domain.grade.entity.Subject;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.term.entity.AcademicTerm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "student_ability", uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_subject_term", columnNames = { "student_info_id", "subject_id",
                "academic_term_id" })
})
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "studentInfo", "subject", "academicTerm" })
public class StudentAbility extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo studentInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id", nullable = false)
    private AcademicTerm academicTerm;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // 세부능력 및 특기사항 내용

    public void updateContent(String content) {
        this.content = content;
    }
}
