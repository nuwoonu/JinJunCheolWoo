package com.example.schoolmate.common.dto.dashboardinfo;

import java.time.LocalDate;

import com.example.schoolmate.soojin.entity.constant.MealTargetType;
import com.example.schoolmate.soojin.entity.constant.MealType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolMealDTO {

    // 오늘의 급식, 전체 급식

    private Long id;

    private LocalDate mealDate;

    private MealTargetType targetType;

    private MealType mealType;

    private String menu;

    private Integer calories;

    private String allergyInfo;
}
