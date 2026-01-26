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

    private LocalDate mealDate; // 날짜

    private MealTargetType targetType; // 급식 대상 (전체/학생/교직원)

    private MealType mealType; // 조식/중식/석식

    private String mealTypeText; // "조식", "중식", "석식" >>?

    private String menu;

    private Integer calories;

    private String allergyInfo;
}
