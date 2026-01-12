package com.example.schoolmate.common.entity;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.example.schoolmate.common.entity.constant.UserRole;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_student")
@DiscriminatorValue("STUDENT")
@Getter
@Builder
public class Student extends User {
    @Column(unique = true, nullable = false)
    private Long studentNumber; // 학번

    @Column(nullable = false)
    private int grade; // 학년

    @Column(nullable = false)
    private int classNum; // 반

    private Date birthDate; // 생일

    private String address; // 주소

    private String phone; // 연락처

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Builder.Default
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Grade> grades = new ArrayList<>();
}
