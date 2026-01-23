package com.example.schoolmate.parkjoon.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.Classroom;

public interface ClassroomRepository extends JpaRepository<Classroom, Long>, ClassroomRepositoryCustom {
    boolean existsByYearAndGradeAndClassNum(int year, int grade, int classNum);
}
