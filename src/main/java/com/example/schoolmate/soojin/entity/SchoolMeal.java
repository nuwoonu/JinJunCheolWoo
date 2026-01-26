package com.example.schoolmate.soojin.entity;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.soojin.entity.constant.MealTargetType;
import com.example.schoolmate.soojin.entity.constant.MealType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@ToString
@Getter
@Table(name = "school_meal_tbl")
@Entity
public class SchoolMeal extends BaseEntity {

    // # 급식 - 교직원(or 영양사)

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    // 날짜
    @Column(nullable = false)
    private LocalDate mealDate;

    // 급식 대상 - 전체, 교직원, 학생
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealTargetType targetType;

    // 급식 유형 - 조식, 중식, 석식
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealType mealType;

    @Column(nullable = false)
    private String menu;

    // 칼로리 (null 가능)
    private Integer calories;

    // 알레르기 정보 (null 가능)
    @Column(length = 500)
    private String allergyInfo;
}
