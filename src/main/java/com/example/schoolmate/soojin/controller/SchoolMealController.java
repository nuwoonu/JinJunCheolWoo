package com.example.schoolmate.soojin.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.dto.dashboardinfo.SchoolMealDTO;
import com.example.schoolmate.soojin.entity.constant.MealTargetType;
import com.example.schoolmate.soojin.entity.constant.MealType;
import com.example.schoolmate.soojin.service.SchoolMealService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Log4j2
@RequestMapping("/soojin")
@RequiredArgsConstructor
@Controller
public class SchoolMealController {

    private final SchoolMealService schoolMealService;

    // 월별 급식표
    @GetMapping("/meal/monthly")
    public String monthlyMeal(@RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month, Model model) {

        LocalDate now = LocalDate.now();
        if (year == null)
            year = now.getYear();
        if (month == null)
            month = now.getMonthValue();

        model.addAttribute("year", year);
        model.addAttribute("month", month);

        return "soojin/meal/monthly";
    }

    // 월별 급식 API
    @GetMapping("/api/meals")
    @ResponseBody
    public List<SchoolMealDTO> getMeals(
            @RequestParam("year") int year,
            @RequestParam("month") int month,
            @RequestParam(value = "mealType", required = false) MealType mealType,
            @RequestParam(value = "targetType", required = false) MealTargetType targetType) {

        List<SchoolMealDTO> meals = schoolMealService.getMonthlyMeal(year, month, targetType);

        if (mealType != null) {
            meals = meals.stream()
                    .filter(m -> m.getMealType() == mealType)
                    .toList();
        }

        return meals;
    }

    // 일별 급식 API (대시보드 용)
    @GetMapping("/api/meals/daily")
    @ResponseBody
    public List<SchoolMealDTO> getDailyMeals(
            @RequestParam(value = "date", required = false) LocalDate date,
            @RequestParam(value = "mealType", required = false) MealType mealType) {

        if (date == null)
            date = LocalDate.now();

        List<SchoolMealDTO> meals = schoolMealService.getDailyMeal(date, null);
        // ↑ getMonthlyMeal → getDailyMeal

        if (mealType != null) {
            meals = meals.stream()
                    .filter(m -> m.getMealType() == mealType)
                    .toList();
        }

        return meals;
    }

}
