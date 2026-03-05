package com.example.schoolmate.repository;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.soojin.entity.SchoolCalendar;
import com.example.schoolmate.soojin.entity.SchoolMeal;
import com.example.schoolmate.soojin.entity.constant.EventType;
import com.example.schoolmate.soojin.entity.constant.MealTargetType;
import com.example.schoolmate.soojin.entity.constant.MealType;
import com.example.schoolmate.soojin.repository.CalendarRepository;
import com.example.schoolmate.soojin.repository.SchoolMealRepository;

@SpringBootTest
public class DashboardTest {

    @Autowired
    private CalendarRepository calendarRepository;

    @Autowired
    private SchoolMealRepository schoolMealRepository;

    // ✅ 학사 일정 테스트

    // 1. 일정 삽입
    @Rollback(false)
    @Transactional
    @Test
    void insertCalendarData() {

        SchoolCalendar event = SchoolCalendar.builder()
                .title("방학식")
                .startDate(LocalDate.of(2026, 2, 2))
                .endDate(LocalDate.of(2026, 2, 3))
                .eventType(EventType.HOLIDAY)
                .targetGrade(null)
                .description("방학식")
                .build();

        calendarRepository.save(event);
    }

    // 2. 급식 삽입
    @Rollback(false)
    @Transactional
    @Test
    void insertMealData() {
        SchoolMeal meal = SchoolMeal.builder()
                .mealDate(LocalDate.of(2026, 1, 30))
                .targetType(MealTargetType.STUDENT)
                .mealType(MealType.LUNCH)
                .menu("미트소스스파게티, 떠먹는 피자, 주먹밥, 오지치즈후라이, 오이피클, 맛김치, 음료(쿨피스) ")
                .calories(1049)
                .build();

        schoolMealRepository.save(meal);

    }

}
