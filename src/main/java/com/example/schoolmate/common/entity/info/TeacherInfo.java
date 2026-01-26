package com.example.schoolmate.common.entity.info;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.info.assignment.TeacherStudent;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("TEACHER")
@Getter
@Setter
public class TeacherInfo extends BaseInfo {
    private String subject; // 담당 과목
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TeacherStatus status = TeacherStatus.EMPLOYED; // 재직 상태 (재직/휴직/퇴직)
    private String department; // 소속 부서 (예: 교무부)
    private String position; // 직책 (부장, 평교사 등)

    // 담당 학생 목록 (교사 -> 학생 관계)
    @OneToMany(mappedBy = "teacherInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeacherStudent> teacherStudents = new ArrayList<>();

    public void update(String subject, String department, String position, TeacherStatus status) {
        this.subject = subject;
        this.department = department;
        this.position = position;
        this.status = status;
    }
}