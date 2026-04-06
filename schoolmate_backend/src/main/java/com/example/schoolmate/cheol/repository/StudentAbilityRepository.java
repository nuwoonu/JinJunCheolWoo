package com.example.schoolmate.cheol.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.cheol.entity.StudentAbility;

public interface StudentAbilityRepository extends JpaRepository<StudentAbility, Long> {

    // 학생 + 과목 + 학기로 단건 조회 (upsert용)
    @Query("SELECT sa FROM StudentAbility sa " +
           "JOIN FETCH sa.subject JOIN FETCH sa.academicTerm " +
           "WHERE sa.studentInfo.id = :studentId AND sa.subject.code = :subjectCode AND sa.academicTerm.id = :termId")
    Optional<StudentAbility> findByStudentAndSubjectAndTerm(
            @Param("studentId") Long studentId,
            @Param("subjectCode") String subjectCode,
            @Param("termId") Long termId);

    // 학생의 전체 세부능력 조회
    @Query("SELECT sa FROM StudentAbility sa " +
           "JOIN FETCH sa.subject JOIN FETCH sa.academicTerm " +
           "WHERE sa.studentInfo.id = :studentId " +
           "ORDER BY sa.academicTerm.schoolYear ASC, sa.academicTerm.semester ASC")
    List<StudentAbility> findByStudentInfoId(@Param("studentId") Long studentId);
}
