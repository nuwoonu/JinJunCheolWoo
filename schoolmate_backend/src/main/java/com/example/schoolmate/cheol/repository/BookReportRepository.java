package com.example.schoolmate.cheol.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.cheol.entity.BookReport;

public interface BookReportRepository extends JpaRepository<BookReport, Long> {

    // 학생별 전체 독서록 조회
    List<BookReport> findByStudentInfoIdOrderByCreateDateDesc(Long studentInfoId);

    // 학생 + 학기별 독서록 조회
    List<BookReport> findByStudentInfoIdAndAcademicTermId(Long studentInfoId, Long academicTermId);
}
