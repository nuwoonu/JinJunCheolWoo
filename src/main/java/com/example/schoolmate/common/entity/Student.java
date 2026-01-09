package com.example.schoolmate.common.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_student")
@DiscriminatorValue("STUDENT")
@Getter
@Setter
public class Student extends User {
    private String studentNumber; // 학번
    private int grade; // 학년
    private int classNum; // 반
}
