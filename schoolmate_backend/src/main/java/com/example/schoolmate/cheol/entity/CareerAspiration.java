package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "career_aspirations", uniqueConstraints = @UniqueConstraint(columnNames = { "student_id", "year",
        "semester" }))
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "student")
public class CareerAspiration extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentInfo student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Year year; // 학년 (FIRST, SECOND, THIRD)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Semester semester; // 학기 (FIRST, FALL)

    // ========== 특기 또는 흥미 ==========
    @Column(length = 200)
    private String specialtyOrInterest; // 특기 또는 흥미 (예: "독서, 영화감상")

    // ========== 학생이 작성한 진로희망 ==========
    @Column(length = 100)
    private String studentDesiredJob; // 학생 희망 직업 (예: "과학자")

    // ========== 학부모가 작성한 진로희망 ==========
    @Column(length = 100)
    private String parentDesiredJob; // 학부모 희망 직업 (예: "의사")

    // ========== 공통 정보 ==========
    @Column(length = 1000)
    private String preparationPlan; // 준비 계획

    @Column(length = 1000)
    private String notes; // 특이사항/비고

    // 학생 정보 수정
    public void updateStudentInfo(
            String specialtyOrInterest,
            String studentDesiredJob) {
        this.specialtyOrInterest = specialtyOrInterest;
        this.studentDesiredJob = studentDesiredJob;
    }

    // 학부모 정보 수정
    public void updateParentInfo(
            String parentDesiredJob) {
        this.parentDesiredJob = parentDesiredJob;
    }

}