package com.example.schoolmate.common.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_teacher")
@DiscriminatorValue("TEACHER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher extends User {
    private String subject; // 담당 과목
    private String employeeNumber; // 사번

    public void changeSubject(String subject) {
        this.subject = subject;
    }

    public void changeEmployeeNumber(String employeeNumber) {
        this.employeeNumber = employeeNumber;
    }
}
