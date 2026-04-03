package com.example.schoolmate.soojin.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.soojin.entity.StudentAttendance;

// [woo] 학생 출결 Repository
public interface AttendanceRepository extends JpaRepository<StudentAttendance, Long> {

    // [woo] 날짜별 학생 출결 조회 (학교 범위)
    @Query("SELECT sa FROM StudentAttendance sa " +
            "JOIN FETCH sa.studentInfo si " +
            "JOIN FETCH si.user " +
            "LEFT JOIN si.assignments ca ON ca.schoolYear.status = com.example.schoolmate.domain.term.entity.SchoolYearStatus.CURRENT " +
            "LEFT JOIN ca.classroom " +
            "WHERE sa.attendanceDate = :date " +
            "AND si.school.id = :schoolId " +
            "ORDER BY ca.classroom.grade, ca.classroom.classNum, ca.attendanceNum")
    List<StudentAttendance> findByDateAndSchool(
            @Param("date") LocalDate date,
            @Param("schoolId") Long schoolId);

    // [woo] 날짜 + 학년 필터
    @Query("SELECT sa FROM StudentAttendance sa " +
            "JOIN FETCH sa.studentInfo si " +
            "JOIN FETCH si.user " +
            "LEFT JOIN si.assignments ca ON ca.schoolYear.status = com.example.schoolmate.domain.term.entity.SchoolYearStatus.CURRENT " +
            "LEFT JOIN ca.classroom c " +
            "WHERE sa.attendanceDate = :date " +
            "AND si.school.id = :schoolId " +
            "AND c.grade = :grade " +
            "ORDER BY c.classNum, ca.attendanceNum")
    List<StudentAttendance> findByDateAndSchoolAndGrade(
            @Param("date") LocalDate date,
            @Param("schoolId") Long schoolId,
            @Param("grade") int grade);

    // [woo] 날짜 + 학년 + 반 필터
    @Query("SELECT sa FROM StudentAttendance sa " +
            "JOIN FETCH sa.studentInfo si " +
            "JOIN FETCH si.user " +
            "LEFT JOIN si.assignments ca ON ca.schoolYear.status = com.example.schoolmate.domain.term.entity.SchoolYearStatus.CURRENT " +
            "LEFT JOIN ca.classroom c " +
            "WHERE sa.attendanceDate = :date " +
            "AND si.school.id = :schoolId " +
            "AND c.grade = :grade " +
            "AND c.classNum = :classNum " +
            "ORDER BY ca.attendanceNum")
    List<StudentAttendance> findByDateAndSchoolAndGradeAndClassNum(
            @Param("date") LocalDate date,
            @Param("schoolId") Long schoolId,
            @Param("grade") int grade,
            @Param("classNum") int classNum);

    // [woo] 특정 학생의 기간별 출결 조회 (학부모/학생 본인 조회용)
    @Query("SELECT sa FROM StudentAttendance sa " +
            "WHERE sa.studentInfo.id = :studentInfoId " +
            "AND sa.attendanceDate BETWEEN :startDate AND :endDate " +
            "ORDER BY sa.attendanceDate DESC")
    List<StudentAttendance> findByStudentAndDateRange(
            @Param("studentInfoId") Long studentInfoId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // [woo] 특정 학생의 특정 날짜 출결 존재 여부
    boolean existsByStudentInfoIdAndAttendanceDate(Long studentInfoId, LocalDate attendanceDate);

    // [woo] 기간 내 출결 처리된 날짜 수 (교사용 - 담임 반 학생 기준)
    @Query("SELECT COUNT(DISTINCT sa.attendanceDate) FROM StudentAttendance sa " +
            "WHERE sa.studentInfo.id IN :studentInfoIds " +
            "AND sa.attendanceDate BETWEEN :startDate AND :endDate")
    long countDistinctDatesByStudentInfoIds(
            @Param("studentInfoIds") Set<Long> studentInfoIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // [soojin] 담임 반 학급 기간별 출결 조회 (월별 출석률 계산용)
    @Query("SELECT sa FROM StudentAttendance sa " +
            "WHERE sa.studentInfo.id IN :studentInfoIds " +
            "AND sa.attendanceDate BETWEEN :startDate AND :endDate")
    List<StudentAttendance> findByStudentInfoIdsAndDateRange(
            @Param("studentInfoIds") Set<Long> studentInfoIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // [woo] 여러 학생의 특정 날짜 출결 조회 (담임 반 학생 출결 - school 무관)
    @Query("SELECT sa FROM StudentAttendance sa " +
            "JOIN FETCH sa.studentInfo si " +
            "JOIN FETCH si.user " +
            "LEFT JOIN si.assignments ca ON ca.schoolYear.status = com.example.schoolmate.domain.term.entity.SchoolYearStatus.CURRENT " +
            "LEFT JOIN ca.classroom " +
            "WHERE sa.studentInfo.id IN :studentInfoIds " +
            "AND sa.attendanceDate = :date " +
            "ORDER BY ca.classroom.grade, ca.classroom.classNum, ca.attendanceNum")
    List<StudentAttendance> findByStudentInfoIdInAndAttendanceDate(
            @Param("studentInfoIds") Set<Long> studentInfoIds,
            @Param("date") LocalDate date);
}
