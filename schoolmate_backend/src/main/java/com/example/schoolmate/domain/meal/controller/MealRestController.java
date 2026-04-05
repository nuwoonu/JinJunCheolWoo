package com.example.schoolmate.domain.meal.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.dashboard.dto.SchoolMealDTO;
import com.example.schoolmate.domain.meal.entity.constant.MealType;
import com.example.schoolmate.domain.meal.service.SchoolMealService;

import lombok.RequiredArgsConstructor;

// [woo] /api/meals - React SPA에서 /api 프록시로 급식 정보 조회
@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class MealRestController {

    private final SchoolMealService schoolMealService;

    // GET /api/meals/daily?date=2024-03-08&mealType=LUNCH(optional)
    @GetMapping("/daily")
    public ResponseEntity<List<SchoolMealDTO>> getDailyMeals(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) MealType mealType) {
        if (date == null) date = LocalDate.now();
        List<SchoolMealDTO> meals = schoolMealService.getDailyMeal(date, null);
        if (mealType != null) {
            meals = meals.stream().filter(m -> m.getMealType() == mealType).toList();
        }
        return ResponseEntity.ok(meals);
    }
}
