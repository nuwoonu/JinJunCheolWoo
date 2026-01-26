package com.example.schoolmate.soojin.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.soojin.entity.SchoolCalendar;

public interface CalendarRepository extends JpaRepository<SchoolCalendar, Long> {

    // 1. 월별 조회 (해당 월에 걸쳐있는 모든 일정)
    @Query("SELECT c FROM SchoolCalendar c " + "WHERE c.startDate <= :endOfMonth " +
           "AND (c.endDate >= :startOfMonth OR (c.endDate IS NULL AND c.startDate >= :startOfMonth)) " +
           "ORDER BY c.startDate")
    List<SchoolCalendar> findByMonth(@Param("startOfMonth") LocalDate startOfMonth,
                                      @Param("endOfMonth") LocalDate endOfMonth);
    // 2. 학년 (전체 대상 + 특정 학년)
    @Query("SELECT c FROM SchoolCalendar c " +
           "WHERE c.startDate <= :endOfMonth " +
           "AND (c.endDate >= :startOfMonth OR (c.endDate IS NULL AND c.startDate >= :startOfMonth)) " +
           "AND (c.targetGrade IS NULL OR c.targetGrade = :grade) " +
           "ORDER BY c.startDate")
    List<SchoolCalendar> findByMonthAndGrade(@Param("startOfMonth") LocalDate startOfMonth,
                                              @Param("endOfMonth") LocalDate endOfMonth,
                                              @Param("grade") Integer grade);

    // 3. 다가오는 일정 (오늘 포함) 
     List<SchoolCalendar> findByStartDateGreaterThanEqualOrderByStartDateAsc(LocalDate date);




}
