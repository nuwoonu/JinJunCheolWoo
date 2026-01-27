package com.example.schoolmate.soojin.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.soojin.entity.SchoolCalendar;

public interface SchoolCalendarRepository extends JpaRepository<SchoolCalendar, Long> {

    // 기간이 겹치는 일정 조회 (Overlap Query)
    // 조건: (일정 시작일 < 조회 종료일) AND (일정 종료일(없으면 시작일) >= 조회 시작일)
    @Query("SELECT s FROM SchoolCalendar s " +
            "WHERE s.startDate < :end " +
            "AND COALESCE(s.endDate, s.startDate) >= :start")
    List<SchoolCalendar> findOverlappingEvents(@Param("start") LocalDate start, @Param("end") LocalDate end);
}