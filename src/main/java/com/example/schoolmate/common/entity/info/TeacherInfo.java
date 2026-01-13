package com.example.schoolmate.common.entity.info;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("TEACHER")
@Getter
@Setter
public class TeacherInfo extends BaseInfo {
    private String subject; // 담당 과목
    private String department; // 소속 부서 (예: 교무부)
}