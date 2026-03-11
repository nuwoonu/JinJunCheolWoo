package com.example.schoolmate.woo.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.soojin.entity.constant.DayOfWeek;
import com.example.schoolmate.woo.entity.TeacherSchedule;
import com.example.schoolmate.woo.entity.constant.RepeatType;

public interface TeacherScheduleRepository extends JpaRepository<TeacherSchedule, Long> {

    // 교사의 전체 일정 조회 (교시 순)
    List<TeacherSchedule> findByTeacherIdOrderByDayOfWeekAscPeriodAsc(Long teacherInfoId);

    // 교사의 특정 요일 일정 조회 (교시 순)
    List<TeacherSchedule> findByTeacherIdAndDayOfWeekOrderByPeriodAsc(Long teacherInfoId, DayOfWeek dayOfWeek);

    // 오늘의 일정: 매주/격주 반복 + 해당 요일 OR 일회성 + 해당 날짜
    @Query("SELECT s FROM TeacherSchedule s WHERE s.teacher.id = :teacherId " +
           "AND ((s.repeatType IN :recurringTypes AND s.dayOfWeek = :dayOfWeek) " +
           "OR (s.repeatType = :onceType AND s.specificDate = :date)) " +
           "ORDER BY s.period ASC")
    List<TeacherSchedule> findTodaySchedules(
            @Param("teacherId") Long teacherInfoId,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("date") LocalDate date,
            @Param("recurringTypes") List<RepeatType> recurringTypes,
            @Param("onceType") RepeatType onceType);

    // 중복 체크: 같은 요일, 같은 교시에 이미 일정이 있는지
    boolean existsByTeacherIdAndDayOfWeekAndPeriodAndRepeatTypeNot(
            Long teacherInfoId, DayOfWeek dayOfWeek, Integer period, RepeatType excludeType);

    boolean existsByTeacherIdAndDayOfWeekAndPeriod(
            Long teacherInfoId, DayOfWeek dayOfWeek, Integer period);
}
