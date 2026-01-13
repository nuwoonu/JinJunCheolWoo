package com.example.schoolmate.common.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.Grade;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByStudentId(Long studentId);

    List<Grade> findBySubjectId(Long subjectId);

    List<Grade> findByStudentIdAndSemesterAndYear(Long studentId, int semester, int year);

    @Query("SELECT g FROM Grade g WHERE g.student.id = :studentId AND g.subject.id = :subjectId")
    List<Grade> findByStudentAndSubject(
            @Param("studentId") Long studentId,
            @Param("subjectId") Long subjectId);
}
