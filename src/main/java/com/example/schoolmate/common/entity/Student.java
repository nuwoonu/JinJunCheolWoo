package com.example.schoolmate.common.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_student")
@DiscriminatorValue("STUDENT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student extends User {
    private String studentNumber; // 학번
    private int grade; // 학년
    private int classNum; // 반
    private String emergencyContact; // 비상연락처

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Parent parent; // 학부모

    public void changeStudentNumber(String studentNumber) {
        this.studentNumber = studentNumber;
    }

    public void changeGrade(int grade) {
        this.grade = grade;
    }

    public void changeClassNum(int classNum) {
        this.classNum = classNum;
    }

    public void changeEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public void changeParent(Parent parent) {
        this.parent = parent;
    }
}
