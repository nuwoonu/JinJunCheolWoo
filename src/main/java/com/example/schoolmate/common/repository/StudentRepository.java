package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentNumber(Long studentNumber);

    List<Student> findByGrade(int grade);

    List<Student> findByClassId(Long classId);

    @Query("SELECT s FROM Student s JOIN FETCH s.grades WHERE s.id = :id")
    Optional<Student> findByIdWithGrades(@Param("id") Long id);
}