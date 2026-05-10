package com.example.schoolmate.domain.dailysummary.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.dailysummary.entity.ChildDailySummary;

public interface ChildDailySummaryRepository extends JpaRepository<ChildDailySummary, Long> {

    Optional<ChildDailySummary> findByStudentIdAndSummaryDate(Long studentId, LocalDate summaryDate);

    // [woo] 학부모 앱 - 특정 학생의 최근 요약 목록
    List<ChildDailySummary> findByStudentIdOrderBySummaryDateDesc(Long studentId);
}
