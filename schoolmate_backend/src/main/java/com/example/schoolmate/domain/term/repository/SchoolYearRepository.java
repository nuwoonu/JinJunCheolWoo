package com.example.schoolmate.domain.term.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.term.entity.SchoolYear;
import com.example.schoolmate.domain.term.entity.SchoolYearStatus;

public interface SchoolYearRepository extends JpaRepository<SchoolYear, Long> {

    /** 특정 학교의 현재 학년도 조회 */
    Optional<SchoolYear> findBySchoolIdAndStatus(Long schoolId, SchoolYearStatus status);

    /** 특정 학교의 특정 연도 조회 */
    Optional<SchoolYear> findBySchoolIdAndYear(Long schoolId, int year);

    /** 특정 학교의 전체 학년도 목록 (최신순) */
    List<SchoolYear> findBySchoolIdOrderByYearDesc(Long schoolId);
}
