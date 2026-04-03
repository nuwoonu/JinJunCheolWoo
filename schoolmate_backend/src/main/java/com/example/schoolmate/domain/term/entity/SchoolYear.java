package com.example.schoolmate.domain.term.entity;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 학년도 엔티티
 *
 * 학교별 학년도를 관리합니다. AcademicTerm, StudentAssignment, Classroom 등
 * 학년도 기반의 모든 엔티티가 이 엔티티를 FK로 참조합니다.
 *
 * - status = CURRENT : 현재 진행 중인 학년도 (학교당 1개)
 * - status = PAST    : 종료된 학년도 (역사 기록으로 영구 보존)
 */
@Entity
@Table(
    name = "school_year",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_school_year_school_year", columnNames = {"school_id", "year"})
    }
)
@Getter
@Setter
@NoArgsConstructor
public class SchoolYear extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 학년도 정수값 (예: 2025, 2026) */
    @Column(nullable = false)
    private int year;

    /** 학년도 상태 - CURRENT: 현재 학년도, PAST: 종료된 학년도 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SchoolYearStatus status;

    public SchoolYear(int year, SchoolYearStatus status) {
        this.year = year;
        this.status = status;
    }

    /** 표시명 (예: "2025학년도") */
    public String getDisplayName() {
        return year + "학년도";
    }
}
