package com.example.schoolmate.domain.term.entity;

import java.time.LocalDate;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 학기(학사 기간) 엔티티
 *
 * 학교의 학년도·학기를 학적 관리의 기준점으로 사용합니다.
 * 모든 학기 기반 데이터(CourseSection, StudentTimetable 등)는 이 엔티티를 FK로 참조합니다.
 *
 * - status = ACTIVE  : 현재 진행 중인 학기 (학교당 1개)
 * - status = CLOSED  : 종료된 학기 (역사 기록으로 영구 보존)
 *
 * 기존 SystemSetting의 currentSchoolYear / currentSemester 역할을 대체합니다.
 */
@Entity
@Table(
    name = "academic_term",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"school_id", "school_year", "semester"})
    }
)
@Getter
@Setter
@NoArgsConstructor
public class AcademicTerm extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 학년도 (예: 2025, 2026) */
    @Column(nullable = false)
    private int schoolYear;

    /** 학기 (1 또는 2) */
    @Column(nullable = false)
    private int semester;

    /** 학기 시작일 */
    private LocalDate startDate;

    /** 학기 종료일 */
    private LocalDate endDate;

    /** 학기 상태 - ACTIVE: 현재 학기, CLOSED: 종료된 학기 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AcademicTermStatus status;

    @Builder
    public AcademicTerm(int schoolYear, int semester, LocalDate startDate,
                        LocalDate endDate, AcademicTermStatus status) {
        this.schoolYear = schoolYear;
        this.semester = semester;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status != null ? status : AcademicTermStatus.ACTIVE;
    }

    /** 학기 표시명 (예: "2025학년도 1학기") */
    public String getDisplayName() {
        return schoolYear + "학년도 " + semester + "학기";
    }
}
