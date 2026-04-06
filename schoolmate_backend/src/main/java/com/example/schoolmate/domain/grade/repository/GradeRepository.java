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

    // [woo] 분반(학급+과목+학기) 기준 학생 성적 목록 (교사 성적 입력/조회용)
    @Query("""
        SELECT g FROM Grade g
        JOIN FETCH g.student s
        JOIN FETCH s.user
        JOIN s.assignments sa
        WHERE sa.classroom.cid = :classroomId
        AND g.subject.id = :subjectId
        AND g.academicTerm.id = :termId
        AND g.testType = :testType
        AND sa.schoolYear = g.academicTerm.schoolYear
        ORDER BY sa.attendanceNum ASC
        """)
    List<Grade> findBySectionAndTestType(
            @Param("classroomId") Long classroomId,
            @Param("subjectId") Long subjectId,
            @Param("termId") Long termId,
            @Param("testType") TestType testType);

    // [woo] 학생 본인 성적 조회 (학기별)
    @Query("""
        SELECT g FROM Grade g
        JOIN FETCH g.subject
        WHERE g.student.id = :studentInfoId
        AND g.academicTerm.id = :termId
        ORDER BY g.subject.name ASC, g.testType ASC
        """)
    List<Grade> findByStudentAndTerm(
            @Param("studentInfoId") Long studentInfoId,
            @Param("termId") Long termId);

    // [woo] 학급 전체 성적 조회 (담임교사용 - 과목별)
    @Query("""
        SELECT g FROM Grade g
        JOIN FETCH g.student s
        JOIN FETCH s.user
        JOIN FETCH g.subject
        JOIN s.assignments sa
        WHERE sa.classroom.cid = :classroomId
        AND g.academicTerm.id = :termId
        AND sa.schoolYear = g.academicTerm.schoolYear
        ORDER BY sa.attendanceNum ASC, g.subject.name ASC, g.testType ASC
        """)
    List<Grade> findByClassroomAndTerm(
            @Param("classroomId") Long classroomId,
            @Param("termId") Long termId);

    // [woo] 학년 전체 성적 조회 (동일 학교 + 동일 학년 모든 반, 학년 비교용)
    @Query("""
        SELECT g FROM Grade g
        JOIN FETCH g.student s
        JOIN FETCH s.user
        JOIN FETCH g.subject
        JOIN s.assignments sa
        WHERE sa.classroom.school.id = :schoolId
        AND sa.classroom.grade = :grade
        AND g.academicTerm.id = :termId
        AND sa.schoolYear = g.academicTerm.schoolYear
        ORDER BY g.subject.name ASC, g.testType ASC
        """)
    List<Grade> findBySchoolGradeAndTerm(
            @Param("schoolId") Long schoolId,
            @Param("grade") int grade,
            @Param("termId") Long termId);

    // [woo] upsert 중복 확인 (subject ID 기반)
    Optional<Grade> findByStudentIdAndSubjectIdAndAcademicTermIdAndTestType(
            Long studentId, Long subjectId, Long academicTermId, TestType testType);
}
