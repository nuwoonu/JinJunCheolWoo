package com.example.schoolmate.homework.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.homework.entity.HomeworkSubmission;

/**
 * [woo] 과제 제출 Repository
 */
public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, Long> {

    // [woo] 특정 과제 + 특정 학생의 제출 조회 (1인 1제출 확인)
    Optional<HomeworkSubmission> findByHomeworkIdAndStudentId(Long homeworkId, Long studentInfoId);

    // [woo] 특정 과제의 전체 제출 목록 (교사가 제출 현황 확인)
    List<HomeworkSubmission> findByHomeworkIdOrderBySubmittedAtDesc(Long homeworkId);

    // [woo] 특정 학생의 전체 제출 이력 (학부모가 자녀 제출 현황 확인)
    @Query("SELECT s FROM HomeworkSubmission s WHERE s.student.id = :studentInfoId ORDER BY s.submittedAt DESC")
    List<HomeworkSubmission> findByStudentInfoId(@Param("studentInfoId") Long studentInfoId);

    // [woo] 특정 과제에 제출한 학생 수
    long countByHomeworkId(Long homeworkId);

    // [woo] 특정 학생이 특정 과제에 제출했는지 여부
    boolean existsByHomeworkIdAndStudentId(Long homeworkId, Long studentInfoId);

    // [woo] FinalGrade 계산용: 채점 완료된 제출 (학생+학급+과목 필터)
    @Query("SELECT hs FROM HomeworkSubmission hs " +
           "JOIN FETCH hs.homework h " +
           "WHERE hs.student.id = :studentId " +
           "AND h.courseSection.classroom.cid = :classroomId " +
           "AND h.courseSection.subject.id = :subjectId " +
           "AND hs.status = :status")
    List<HomeworkSubmission> findGradedByStudentAndClassroomAndSubject(
            @Param("studentId") Long studentId,
            @Param("classroomId") Long classroomId,
            @Param("subjectId") Long subjectId,
            @Param("status") HomeworkSubmission.SubmissionStatus status);
}
