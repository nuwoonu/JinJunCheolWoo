package com.example.schoolmate.common.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.constant.Gender;
import com.example.schoolmate.common.entity.constant.Status;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "user_student", uniqueConstraints = {
        @UniqueConstraint(name = "uk_grade_class_number", columnNames = { "grade", "class_num", "student_number" })
})
@DiscriminatorValue("STUDENT")
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Student extends User {
    @Column(nullable = false)
    private Long studentNumber; // 학번

    @Column(nullable = false)
    private int grade; // 학년

    @Column(nullable = false)
    private int classNum; // 반

    private LocalDate birthDate; // 생일

    private String address; // 주소

    private String phone; // 연락처

    @Enumerated(EnumType.STRING)
    private Status status; // 상태

    @Enumerated(EnumType.STRING)
    private Gender gender;

    // 전체 학번 생성 메서드 (표시용)
    public String getFullStudentNumber() {
        return String.format("%d-%d-%02d", grade, classNum, studentNumber);
        // 예: "1-3-05" (1학년 3반 5번)
    }

    @Builder.Default
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Grade> grades = new ArrayList<>();

    public void changeAddress(String address) {
        this.address = address;
    }

    public void changePhone(String phone) {
        this.phone = phone;
    }
}
