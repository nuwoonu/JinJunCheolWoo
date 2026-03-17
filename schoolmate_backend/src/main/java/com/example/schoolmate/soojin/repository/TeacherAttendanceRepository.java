package com.example.schoolmate.soojin.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.soojin.entity.TeacherAttendance;

// [woo] 교사 출결 Repository
public interface TeacherAttendanceRepository extends JpaRepository<TeacherAttendance, Long> {

    // [woo] 날짜별 교사 출결 조회 (학교 범위)
    @Query("SELECT ta FROM TeacherAttendance ta " +
            "JOIN FETCH ta.teacherInfo ti " +
            "JOIN FETCH ti.user " +
            "WHERE ta.attendanceDate = :date " +
            "AND ti.school.id = :schoolId " +
            "ORDER BY ti.user.name")
    List<TeacherAttendance> findByDateAndSchool(
            @Param("date") LocalDate date,
            @Param("schoolId") Long schoolId);

    // [woo] 특정 교사의 기간별 출결 조회
    @Query("SELECT ta FROM TeacherAttendance ta " +
            "WHERE ta.teacherInfo.id = :teacherInfoId " +
            "AND ta.attendanceDate BETWEEN :startDate AND :endDate " +
            "ORDER BY ta.attendanceDate DESC")
    List<TeacherAttendance> findByTeacherAndDateRange(
            @Param("teacherInfoId") Long teacherInfoId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // [woo] 특정 교사의 특정 날짜 출결 존재 여부
    boolean existsByTeacherInfoIdAndAttendanceDate(Long teacherInfoId, LocalDate attendanceDate);
}
