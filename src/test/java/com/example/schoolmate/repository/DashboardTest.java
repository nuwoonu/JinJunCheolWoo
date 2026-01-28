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
                .title("행사1")
                .startDate(LocalDate.of(2026, 1, 27))
                .endDate(LocalDate.of(2026, 1, 28))
                .eventType(EventType.EVENT)
                .targetGrade(1)
                .description("1학년 행사1")
                .build();

        calendarRepository.save(event);
    }

}
