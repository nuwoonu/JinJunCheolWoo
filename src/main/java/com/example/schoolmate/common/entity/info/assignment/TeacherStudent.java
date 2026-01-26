package com.example.schoolmate.common.entity.info.assignment;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherRole;

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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 교사-학생 관계 엔티티
 *
 * 교사(TeacherInfo)와 학생(StudentInfo) 간의 다대다(N:M) 관계를
 * 중간 엔티티로 풀어서 관리함.
 *
 * 추가 정보(역할, 학년도 등)를 가질 수 있어 단순 @ManyToMany보다 유연함.
 *
 * 예시:
 * - 2025년도에 김교사가 홍길동 학생의 담임교사
 * - 2025년도에 박교사가 홍길동 학생의 수학 교과담당
 */
@Entity
@Table(
    name = "teacher_student",
    uniqueConstraints = {
        // 같은 학년도에 동일한 교사-학생-역할 조합이 중복되지 않도록 제약
        @UniqueConstraint(columnNames = {"teacher_info_id", "student_info_id", "school_year", "role"})
    }
)
@Getter
@Setter
@NoArgsConstructor
public class TeacherStudent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 교사 정보 (N:1)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_info_id", nullable = false)
    private TeacherInfo teacherInfo;

    // 학생 정보 (N:1)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo studentInfo;

    // 학년도 (예: 2025, 2026)
    // 매년 담임이 바뀌므로 학년도 기준으로 관계를 구분함
    private int schoolYear;

    // 교사의 역할 (담임, 교과담당 등)
    @Enumerated(EnumType.STRING)
    private TeacherRole role;

    // 교과담당인 경우 담당 과목명 (예: "수학", "영어")
    // role이 SUBJECT일 때만 사용됨
    private String subjectName;

    @Builder
    public TeacherStudent(TeacherInfo teacherInfo, StudentInfo studentInfo,
                          int schoolYear, TeacherRole role, String subjectName) {
        this.teacherInfo = teacherInfo;
        this.studentInfo = studentInfo;
        this.schoolYear = schoolYear;
        this.role = role;
        this.subjectName = subjectName;
    }
}
