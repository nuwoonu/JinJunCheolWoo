package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.ActivityCategory;
import com.example.schoolmate.common.entity.user.constant.Year;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// [cheol] 창의적 체험활동 - 학년별 카테고리(자율/동아리/봉사/진로)별 특기사항
@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "cocurricular_activities")
public class CocurricularActivities extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Year year; // 학년

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityCategory category; // 활동 영역

    @Column(columnDefinition = "TEXT")
    private String specifics; // 특기사항

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private StudentInfo student;

    public void update(String specifics) {
        this.specifics = specifics;
    }
}
