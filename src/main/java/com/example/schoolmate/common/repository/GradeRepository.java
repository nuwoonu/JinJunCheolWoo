package com.example.schoolmate.common.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.info.Grade;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByStudent_id(Long studentId);

    List<Grade> findBySubject_Code(String subjectCode);

    List<Grade> findByStudent_idAndSemesterAndYear(Long studentId, int semester, int year);

    @Query("SELECT g FROM Grade g WHERE g.student.id = :studentId AND g.subject.code = :subjectCode")
    List<Grade> findByStudentAndSubject(
            @Param("studentId") Long studentId,
            @Param("subjectCode") String subjectCode);
}
