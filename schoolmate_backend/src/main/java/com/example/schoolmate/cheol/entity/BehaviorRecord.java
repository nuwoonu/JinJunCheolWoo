package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.common.entity.info.StudentInfo;
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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// [cheol] 행동 특성 및 종합의견 - 학년/학기별 관리
@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "behavior_records")
public class BehaviorRecord extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 학기 FK - 학년도·학기 정보를 AcademicTerm으로 관리 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id")
    private AcademicTerm academicTerm;

    @Column(columnDefinition = "TEXT")
    private String specialNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private StudentInfo student;

    /** 학년도 정수값 편의 메서드 */
    public int getSchoolYearInt() {
        return academicTerm != null ? academicTerm.getSchoolYearInt() : 0;
    }

    /** 학기 편의 메서드 */
    public int getSemester() {
        return academicTerm != null ? academicTerm.getSemester() : 0;
    }

    public void update(String specialNotes) {
        this.specialNotes = specialNotes;
    }
}
