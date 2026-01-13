package com.example.schoolmate.common.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString(exclude = "teacher")
@Table(name = "subjects")
public class Subject {
    @Id
    private String code; // 과목 코드

    @Column(nullable = false)
    private String name; // 과목명

    private int grade; // 대상 학년

    private Integer credits; // 학점

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_uid")
    private Teacher teacher; // 담당 선생님

    // 양방향 연관관계 편의 메서드
    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    @Builder.Default
    @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Grade> grades = new ArrayList<>();

}
