package com.example.schoolmate.common.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "user_student")
@DiscriminatorValue("STUDENT")
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Student extends User {
    @Column(unique = true, nullable = false)
    private Long studentNumber; // 학번

    @Column(nullable = false)
    private int grade; // 학년

    @Column(nullable = false)
    private int classNum; // 반

    private LocalDate birthDate; // 생일

    private String address; // 주소

    private String phone; // 연락처

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
