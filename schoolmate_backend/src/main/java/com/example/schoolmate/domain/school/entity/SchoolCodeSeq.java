package com.example.schoolmate.domain.school.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 학교별·역할별·연도별 코드 순번 관리 테이블
 * 학번/사번 자동 채번의 원자적 처리를 위해 DB가 직접 순번을 관리합니다.
 *
 * roleType 접두어:
 *   T  = 교사(Teacher)    → T20260001
 *   S  = 학생(Student)    → S20260001
 *   E  = 교직원(Employee) → E20260001
 *   P  = 학부모(Parent)   → P20260001 (schoolId = 0 : 전역)
 */
@Entity
@Table(name = "school_code_seq", uniqueConstraints = {
        @UniqueConstraint(name = "uk_code_seq_school_type_year",
                columnNames = { "school_id", "role_type", "year" })
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SchoolCodeSeq {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "role_type", nullable = false, length = 4)
    private String roleType;

    @Column(nullable = false)
    private int year;

    @Column(name = "next_seq", nullable = false)
    private int nextSeq = 1;

    public SchoolCodeSeq(Long schoolId, String roleType, int year) {
        this.schoolId = schoolId;
        this.roleType = roleType;
        this.year = year;
        this.nextSeq = 1;
    }

    /** 현재 순번을 반환하고 다음 순번으로 증가 */
    public int getAndIncrement() {
        int current = this.nextSeq;
        this.nextSeq++;
        return current;
    }
}
