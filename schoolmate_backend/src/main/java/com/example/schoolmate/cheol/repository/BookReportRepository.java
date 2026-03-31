package com.example.schoolmate.cheol.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.cheol.entity.BookReport;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

public interface BookReportRepository extends JpaRepository<BookReport, Long> {

    // 학생별 전체 독서록 조회
    List<BookReport> findByStudentInfoIdOrderByCreateDateDesc(Long studentInfoId);

    // 학생 + 학년별 독서록 조회
    List<BookReport> findByStudentInfoIdAndYear(Long studentInfoId, Year year);

    // 학생 + 학년 + 학기별 독서록 조회
    List<BookReport> findByStudentInfoIdAndYearAndSemester(Long studentInfoId, Year year, Semester semester);
}
