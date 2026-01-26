package com.example.schoolmate.parkjoon.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.Classroom;

public interface ClassroomRepository extends JpaRepository<Classroom, Long>, ClassroomRepositoryCustom {
    boolean existsByYearAndGradeAndClassNum(int year, int grade, int classNum);

    // 담임 교사 ID와 학년도로 학급 찾기
    Optional<Classroom> findByHomeroomTeacherIdAndYear(Long teacherId, int year);

    // 학년도, 학년, 반으로 학급 찾기
    Optional<Classroom> findByYearAndGradeAndClassNum(int year, int grade, int classNum);

    // 담임 교사 ID로 모든 학급 찾기 (여러 해 담임 이력)
    List<Classroom> findByHomeroomTeacherId(Long teacherId);

    // 학년도로 모든 학급 찾기
    List<Classroom> findByYear(int year);

    // 학년도와 학년으로 학급 찾기
    List<Classroom> findByYearAndGrade(int year, int grade);

    // 학급 학생들과 함께 조회 (Fetch Join)
    @Query("SELECT c FROM Classroom c LEFT JOIN FETCH c.students WHERE c.cid = :cid")
    Optional<Classroom> findByIdWithStudents(@Param("cid") Long cid);
}
