package com.example.schoolmate.common.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.Grade;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByStudent_Uid(Long studentUid);

    List<Grade> findBySubject_Code(String subjectCode);

    List<Grade> findByStudent_UidAndSemesterAndYear(Long studentUid, int semester, int year);

    @Query("SELECT g FROM Grade g WHERE g.student.uid = :studentUid AND g.subject.code = :subjectCode")
    List<Grade> findByStudentAndSubject(
            @Param("studentUid") Long studentUid,
            @Param("subjectCode") String subjectCode);
}
