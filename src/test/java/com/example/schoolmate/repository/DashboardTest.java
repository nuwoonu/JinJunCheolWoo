package com.example.schoolmate.repository;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.soojin.entity.SchoolCalendar;
import com.example.schoolmate.soojin.entity.constant.EventType;
import com.example.schoolmate.soojin.repository.CalendarRepository;

@SpringBootTest
public class DashboardTest {

    @Autowired
    private CalendarRepository calendarRepository;

    // ✅ 학사 일정 테스트

    // 1. 일정 삽입
    @Rollback(false)
    @Transactional
    @Test
    void insertCalendarData() {

        SchoolCalendar event = SchoolCalendar.builder()
                .title("시험")
                .startDate(LocalDate.of(2026, 1, 15))
                .endDate(LocalDate.of(2026, 1, 16))
                .eventType(EventType.EXAM)
                .targetGrade(1)
                .description("입학 시험")
                .build();

        calendarRepository.save(event);
    }

}
