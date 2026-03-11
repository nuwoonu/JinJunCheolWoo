package com.example.schoolmate.soojin.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.soojin.entity.SchoolMeal;
import com.example.schoolmate.soojin.entity.constant.MealTargetType;

public interface SchoolMealRepository extends JpaRepository<SchoolMeal, Long> {
    List<SchoolMeal> findByMealDate(LocalDate mealDate);

    List<SchoolMeal> findByMealDateAndTargetType(
            LocalDate mealDate,
            MealTargetType targetType);

    List<SchoolMeal> findByMealDateBetweenOrderByMealDateAscMealTypeAsc(
            LocalDate startDate,
            LocalDate endDate);

    List<SchoolMeal> findByMealDateBetweenAndTargetTypeOrderByMealDateAscMealTypeAsc(
            LocalDate startDate,
            LocalDate endDate,
            MealTargetType targetType);
}
