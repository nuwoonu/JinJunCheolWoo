package com.example.schoolmate.domain.studentrecord.career.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.studentrecord.career.entity.CareerAspiration;

public interface CareerAspirationRepository extends JpaRepository<CareerAspiration, Long> {

    // 학생+학기로 조회 (작성/수정에 필요)
    Optional<CareerAspiration> findByStudentIdAndAcademicTermId(
            Long studentId, Long academicTermId);

    // 학생별 전체 진로희망 조회
    List<CareerAspiration> findByStudentIdOrderByAcademicTerm_SchoolYear_YearAscAcademicTerm_SemesterAsc(Long studentId);
}