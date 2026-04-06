package com.example.schoolmate.domain.teacher.entity;
import com.example.schoolmate.global.entity.SchoolMemberInfo;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.domain.grade.entity.Subject;
import com.example.schoolmate.domain.teacher.entity.TeacherStudent;
import com.example.schoolmate.domain.teacher.entity.constant.TeacherStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/**
 * 교사 상세 정보 엔티티
 * 
 * 교원의 직무 및 인사 정보를 관리합니다.
 * - 담당 과목, 소속 부서, 직책, 재직 상태
 */
@Entity
@Table(name = "teacher_info", uniqueConstraints = {
        @UniqueConstraint(name = "uk_teacher_code_school", columnNames = { "code", "school_id" })
})
@DiscriminatorValue("TEACHER")
@Getter
@Setter
public class TeacherInfo extends SchoolMemberInfo {
    // cheol
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_code")
    private Subject subject; // 담당 과목 (Subject 엔티티 참조)

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TeacherStatus status = TeacherStatus.EMPLOYED; // 재직 상태 (재직/휴직/퇴직)
    private String department; // 소속 부서 (예: 교무부)
    private String position; // 직책 (부장, 평교사 등)

    // 담당 학생 목록 (교사 -> 학생 관계)
    @OneToMany(mappedBy = "teacherInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeacherStudent> teacherStudents = new ArrayList<>();

    // cheol
    public void update(Subject subject, String department, String position, TeacherStatus status) {
        this.subject = subject;
        this.department = department;
        this.position = position;
        this.status = status;
    }
}