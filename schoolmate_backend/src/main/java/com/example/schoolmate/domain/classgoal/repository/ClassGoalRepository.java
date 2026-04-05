package com.example.schoolmate.domain.classgoal.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.classgoal.entity.ClassGoal;

// [soojin] 학급 목표 Repository
public interface ClassGoalRepository extends JpaRepository<ClassGoal, Long> {

    // 학급 + 연도 + 월로 조회 (월별 목표 조회)
    Optional<ClassGoal> findByClassroom_CidAndYearAndMonth(Long classroomId, int year, int month);
}
