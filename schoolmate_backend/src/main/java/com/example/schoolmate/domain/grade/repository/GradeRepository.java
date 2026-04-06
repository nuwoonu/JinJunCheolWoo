package com.example.schoolmate.domain.grade.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.grade.entity.Grade;
import com.example.schoolmate.domain.user.entity.constant.TestType;

public interface GradeRepository extends JpaRepository<Grade, Long> {

    @Query("SELECT g FROM Grade g WHERE g.student.id = :studentId AND g.subject.code = :subjectCode")
    List<Grade> findByStudentAndSubject(
            @Param("studentId") Long studentId,
            @Param("subjectCode") String subjectCode);

    // 동일 학생/과목/시험종류/학기 중복 조회 — upsert 처리용
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject WHERE g.student.id = :studentId AND g.subject.code = :subjectCode AND g.testType = :testType AND g.academicTerm.id = :termId")
    Optional<Grade> findDuplicate(
            @Param("studentId") Long studentId,
            @Param("subjectCode") String subjectCode,
            @Param("testType") TestType testType,
            @Param("termId") Long termId);

    // 전체 성적 조회 - Subject Fetch Join
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject JOIN FETCH g.academicTerm")
    List<Grade> findAllWithSubject();

    // 학기별 성적 조회 - AcademicTerm ID 기반
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject WHERE g.academicTerm.id = :termId")
    List<Grade> findByAcademicTermWithSubject(@Param("termId") Long termId);

    // 과목별 성적 조회 - Subject Fetch Join
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject WHERE g.subject.code = :subjectCode")
    List<Grade> findBySubjectCodeWithSubject(@Param("subjectCode") String subjectCode);

    // 학생별 성적 조회 - Subject Fetch Join
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject JOIN FETCH g.academicTerm WHERE g.student.id = :studentId")
    List<Grade> findByStudentIdWithSubject(@Param("studentId") Long studentId);

    // 학생의 특정 학기 성적 조회 - AcademicTerm ID 기반
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject WHERE g.student.id = :studentId AND g.academicTerm.id = :termId")
    List<Grade> findByStudentIdAndAcademicTermWithSubject(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId);
}
