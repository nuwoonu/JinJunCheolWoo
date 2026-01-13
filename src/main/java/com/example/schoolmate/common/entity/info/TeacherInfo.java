package com.example.schoolmate.common.entity.info;

import com.example.schoolmate.common.entity.info.constant.TeacherStatus;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
}