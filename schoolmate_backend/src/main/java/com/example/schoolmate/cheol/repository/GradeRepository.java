package com.example.schoolmate.cheol.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.common.entity.user.constant.Year;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    // List<Grade> findByStudentId(Long studentId);

    // List<Grade> findBySubjectCode(String subjectCode);

    // List<Grade> findByStudentIdAndSemesterAndYear(Long studentId, int semester,
    // Year year);

    @Query("SELECT g FROM Grade g WHERE g.student.id = :studentId AND g.subject.code = :subjectCode")
    List<Grade> findByStudentAndSubject(
            @Param("studentId") Long studentId,
            @Param("subjectCode") String subjectCode);

    // 전체 성적 조회 - Subject Fetch Join
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject")
    List<Grade> findAllWithSubject();

    // 학기/학년별 성적 조회 - Subject Fetch Join
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject WHERE g.semester = :semester AND g.year = :year")
    List<Grade> findBySemesterAndYearWithSubject(
            @Param("semester") int semester,
            @Param("year") Year year);

    // 과목별 성적 조회 - Subject Fetch Join
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject WHERE g.subject.code = :subjectCode")
    List<Grade> findBySubjectCodeWithSubject(@Param("subjectCode") String subjectCode);

    // 학생별 성적 조회 - Subject Fetch Join
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject WHERE g.student.id = :studentId")
    List<Grade> findByStudentIdWithSubject(@Param("studentId") Long studentId);

    // 학생의 특정 학기/학년 성적 조회 - Subject Fetch Join
    @Query("SELECT g FROM Grade g JOIN FETCH g.subject WHERE g.student.id = :studentId AND g.semester = :semester AND g.year = :year")
    List<Grade> findByStudentIdAndSemesterAndYearWithSubject(
            @Param("studentId") Long studentId,
            @Param("semester") int semester,
            @Param("year") Year year);
}
