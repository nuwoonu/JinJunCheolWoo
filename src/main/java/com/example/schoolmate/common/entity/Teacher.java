package com.example.schoolmate.common.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_teacher")
@DiscriminatorValue("TEACHER")
@Getter
@Setter
public class Teacher extends User {
    private String subject; // 담당 과목
    private String employeeNumber; // 사번
    private String number;
}
