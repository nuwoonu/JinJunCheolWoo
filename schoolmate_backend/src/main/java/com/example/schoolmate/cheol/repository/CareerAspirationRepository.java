package com.example.schoolmate.cheol.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.cheol.entity.CareerAspiration;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

public interface CareerAspirationRepository extends JpaRepository<CareerAspiration, Long> {

    // 학생+학년+학기로 조회 (작성/수정에 필요)
    Optional<CareerAspiration> findByStudentIdAndYearAndSemester(
            Long studentId, Year year, Semester semester);
}