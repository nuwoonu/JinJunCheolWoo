package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.user.constant.Year;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Subject extends SchoolBaseEntity {
    @Id
    @Column(nullable = false, unique = true)
    private String code; // 과목 코드

    @Column(nullable = false)
    private String name; // 과목명

    @Enumerated(EnumType.STRING)
    private Year year; // 학년

    public void changeYear(Year year) {
        this.year = year;
    }

}
