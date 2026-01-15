package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentNumber(Long studentNumber);

    Optional<Student> findByEmail(String email);

    List<Student> findByGrade(int grade);

    List<Student> findByClassNum(int classNum);

    @Query("SELECT s FROM Student s JOIN FETCH s.grades WHERE s.uid = :uid")
    Optional<Student> findByUidWithGrades(@Param("uid") Long uid);
}