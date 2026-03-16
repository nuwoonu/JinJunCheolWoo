package com.example.schoolmate.quiz.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.quiz.entity.QuizSubmission;

/**
 * [woo] 퀴즈 응시 결과 Repository
 */
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, Long> {

    // [woo] 특정 퀴즈의 특정 학생 응시 목록
    List<QuizSubmission> findByQuizIdAndStudentIdOrderByAttemptNumberDesc(Long quizId, Long studentInfoId);

    // [woo] 응시 횟수
    int countByQuizIdAndStudentId(Long quizId, Long studentInfoId);

    // [woo] 최고 점수
    @Query("SELECT MAX(s.score) FROM QuizSubmission s WHERE s.quiz.id = :quizId AND s.student.id = :studentId")
    Optional<Integer> findBestScore(@Param("quizId") Long quizId, @Param("studentId") Long studentId);

    // [woo] 특정 퀴즈의 전체 응시 결과 (교사용)
    List<QuizSubmission> findByQuizIdOrderByStudentIdAscAttemptNumberDesc(Long quizId);
}
