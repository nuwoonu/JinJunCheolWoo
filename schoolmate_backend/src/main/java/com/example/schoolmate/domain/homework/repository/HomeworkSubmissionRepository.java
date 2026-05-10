package com.example.schoolmate.domain.homework.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.homework.entity.HomeworkSubmission;

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

    // [woo] 학생 성적 조회용: 채점 완료된 제출 (과목별 평균 계산)
    @Query("SELECT hs FROM HomeworkSubmission hs JOIN FETCH hs.homework h " +
           "WHERE hs.student.id = :studentId AND hs.status = 'GRADED' " +
           "AND h.courseSection.term.id = :termId")
    List<HomeworkSubmission> findGradedByStudentAndTerm(
            @Param("studentId") Long studentId, @Param("termId") Long termId);

    // [woo] 특정 과제에 제출한 학생 수
    long countByHomeworkId(Long homeworkId);

    // [woo] 특정 학생이 특정 과제에 제출했는지 여부
    boolean existsByHomeworkIdAndStudentId(Long homeworkId, Long studentInfoId);

    // [woo] 분반 기준 학생별 제출 수 (성적 요약 제출률 계산용)
    @Query("SELECT hs.student.id, COUNT(hs) FROM HomeworkSubmission hs " +
           "JOIN hs.homework h WHERE h.courseSection.id = :sectionId " +
           "GROUP BY hs.student.id")
    List<Object[]> countByStudentForSection(@Param("sectionId") Long sectionId);

    // [woo] 분반 기준 채점 완료된 전체 제출 (자동채우기용)
    @Query("SELECT hs FROM HomeworkSubmission hs " +
           "JOIN FETCH hs.homework h " +
           "WHERE h.courseSection.id = :sectionId " +
           "AND hs.status = 'GRADED'")
    List<HomeworkSubmission> findGradedBySectionId(@Param("sectionId") Long sectionId);

    // [woo] 분반 기준 마감된 과제의 전체 제출 (미채점 포함, 0점 처리 계산용)
    @Query("SELECT hs FROM HomeworkSubmission hs JOIN FETCH hs.homework h " +
           "WHERE h.courseSection.id = :sectionId AND h.dueDate < CURRENT_TIMESTAMP")
    List<HomeworkSubmission> findAllByPastDueSectionId(@Param("sectionId") Long sectionId);

    // [woo] 분반 기준 마감된 과제 중 미채점 제출 수 (교사 경고용)
    @Query("SELECT COUNT(hs) FROM HomeworkSubmission hs JOIN hs.homework h " +
           "WHERE h.courseSection.id = :sectionId AND h.dueDate < CURRENT_TIMESTAMP " +
           "AND hs.status != 'GRADED'")
    long countUngradedByPastDueSectionId(@Param("sectionId") Long sectionId);

    // [woo] 하루 요약용: 학생의 최근 채점 완료 과제 (최대 3개)
    @Query("SELECT hs FROM HomeworkSubmission hs JOIN FETCH hs.homework h " +
           "WHERE hs.student.id = :studentId AND hs.status = 'GRADED' " +
           "ORDER BY hs.submittedAt DESC")
    List<HomeworkSubmission> findRecentGradedByStudent(
            @Param("studentId") Long studentId,
            org.springframework.data.domain.Pageable pageable);

    // [woo] 하루 요약용: 마감됐지만 학생이 제출하지 않은 과제 목록
    @Query("SELECT h.title FROM Homework h " +
           "WHERE h.courseSection.classroom.id IN (" +
           "  SELECT ca.classroom.id FROM StudentAssignment ca " +
           "  WHERE ca.studentInfo.id = :studentId " +
           "  AND ca.schoolYear.status = com.example.schoolmate.domain.term.entity.SchoolYearStatus.CURRENT" +
           ") " +
           "AND h.dueDate < CURRENT_TIMESTAMP " +
           "AND NOT EXISTS (" +
           "  SELECT 1 FROM HomeworkSubmission hs WHERE hs.homework.id = h.id AND hs.student.id = :studentId" +
           ")")
    List<String> findOverdueNotSubmittedTitles(@Param("studentId") Long studentId);

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
