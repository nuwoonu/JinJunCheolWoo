package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.term.entity.AcademicTerm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "career_aspirations", uniqueConstraints = @UniqueConstraint(columnNames = { "student_id", "academic_term_id" }))
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id", nullable = false)
    private AcademicTerm academicTerm;

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

    /** 학년도 정수값 편의 메서드 */
    public int getSchoolYearInt() {
        return academicTerm != null ? academicTerm.getSchoolYearInt() : 0;
    }

    /** 학기 편의 메서드 */
    public int getSemester() {
        return academicTerm != null ? academicTerm.getSemester() : 0;
    }

}