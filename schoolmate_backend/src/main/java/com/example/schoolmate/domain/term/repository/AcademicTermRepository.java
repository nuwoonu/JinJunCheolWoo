package com.example.schoolmate.domain.term.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.AcademicTermStatus;

public interface AcademicTermRepository extends JpaRepository<AcademicTerm, Long> {

    /** 특정 학교의 현재 활성 학기 조회 */
    Optional<AcademicTerm> findBySchoolIdAndStatus(Long schoolId, AcademicTermStatus status);

    /** 특정 학교의 특정 학년도(int)·학기 조회 */
    Optional<AcademicTerm> findBySchoolIdAndSchoolYear_YearAndSemester(Long schoolId, int year, int semester);

    /** 특정 학교의 전체 학기 목록 (최신순) */
    List<AcademicTerm> findBySchoolIdOrderBySchoolYear_YearDescSemesterDesc(Long schoolId);

    /** 특정 학교의 특정 학년도 학기 목록 */
    List<AcademicTerm> findBySchoolIdAndSchoolYear_YearOrderBySemesterAsc(Long schoolId, int year);
}
