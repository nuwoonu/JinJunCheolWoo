package com.example.schoolmate.soojin.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.dashboardinfo.SchoolMealDTO;
import com.example.schoolmate.soojin.entity.SchoolMeal;
import com.example.schoolmate.soojin.entity.constant.MealTargetType;
import com.example.schoolmate.soojin.repository.SchoolMealRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Transactional
@Log4j2
@Service
@RequiredArgsConstructor
public class SchoolMealService {

        private final SchoolMealRepository schoolMealRepository;

        // ✅조회 (모든 사용자 - 관리자, 선생님, 학생)

        // 1. 월별 급식 조회
        @Transactional(readOnly = true)
        public List<SchoolMealDTO> getMonthlyMeal(
                        int year,
                        int month,
                        MealTargetType targetType) {
                LocalDate startDate = LocalDate.of(year, month, 1);
                LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

                List<SchoolMeal> meals = (targetType == null)
                                ? schoolMealRepository
                                                .findByMealDateBetweenOrderByMealDateAscMealTypeAsc(startDate, endDate)
                                : schoolMealRepository
                                                .findByMealDateBetweenAndTargetTypeOrderByMealDateAscMealTypeAsc(
                                                                startDate, endDate, targetType);

                return meals.stream().map(this::entitytoDto).toList();
        }

        // 2. 일별 급식 조회
        @Transactional(readOnly = true)
        public List<SchoolMealDTO> getDailyMeal(
                        LocalDate date,
                        MealTargetType targetType) {
                List<SchoolMeal> meals = (targetType == null)
                                ? schoolMealRepository.findByMealDate(date)
                                : schoolMealRepository.findByMealDateAndTargetType(date, targetType);

                return meals.stream().map(this::entitytoDto).toList();
        }

        // ✅ 관리자용 급식 등록, 수정, (삭제)
        // --> 방식 고민 중
        // 1. 급식 등록
        public void registerMeal(SchoolMealDTO dto) {

                SchoolMeal meal = SchoolMeal.builder()
                                .mealDate(dto.getMealDate())
                                .targetType(dto.getTargetType())
                                .mealType(dto.getMealType())
                                .menu(dto.getMenu())
                                .calories(dto.getCalories())
                                .allergyInfo(dto.getAllergyInfo())
                                .build();

                schoolMealRepository.save(meal);
        }

        // 2. 급식 수정
        @Transactional(readOnly = true)
        public void modifyMeal(SchoolMealDTO dto) {
                SchoolMeal meal = schoolMealRepository.findById(dto.getId())
                                .orElseThrow(() -> new IllegalArgumentException("급식 정보 없음"));

                meal.changeMealDate(dto.getMealDate());
                meal.changeTargetType(dto.getTargetType());
                meal.changeMealType(dto.getMealType());
                meal.changeMenu(dto.getMenu());
                meal.changeCalories(dto.getCalories());
                meal.changeAllergyInfo(dto.getAllergyInfo());
        }

        // 3. 삭제
        public void removeMeal(Long id) {
                schoolMealRepository.deleteById(id);
        }

        // entityToDto
        private SchoolMealDTO entitytoDto(SchoolMeal meal) {
                return SchoolMealDTO.builder()
                                .id(meal.getId())
                                .mealDate(meal.getMealDate())
                                .targetType(meal.getTargetType())
                                .mealType(meal.getMealType())
                                .menu(meal.getMenu())
                                .calories(meal.getCalories())
                                .allergyInfo(meal.getAllergyInfo())
                                .build();
        }

}
