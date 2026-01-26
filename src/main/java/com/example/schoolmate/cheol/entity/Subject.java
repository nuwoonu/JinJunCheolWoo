package com.example.schoolmate.cheol.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.constant.Year;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Subject {
    @Id
    @Column(nullable = false, unique = true)
    private String code; // 과목 코드

    @Column(nullable = false)
    private String name; // 과목명

    @Enumerated(EnumType.STRING)
    private Year year; // 학년

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private TeacherInfo teacher; // 담당 선생님

    // 양방향 연관관계 편의 메서드
    public void setTeacher(TeacherInfo teacher) {
        this.teacher = teacher;
    }

    public void changeYear(Year year) {
        this.year = year;
    }
}
