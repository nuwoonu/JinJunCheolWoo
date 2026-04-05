package com.example.schoolmate.domain.quiz.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.quiz.entity.Quiz;

/**
 * [woo] 퀴즈 Repository
 */
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    // [woo] 교사: 내가 출제한 퀴즈 목록
    @Query("SELECT q FROM Quiz q WHERE q.teacher.id = :teacherInfoId AND q.isDeleted = false ORDER BY q.createDate DESC")
    Page<Quiz> findByTeacherInfoId(@Param("teacherInfoId") Long teacherInfoId, Pageable pageable);

    // [woo] 학생: 내 학급 퀴즈 목록
    Page<Quiz> findByClassroomCidAndIsDeletedFalseOrderByCreateDateDesc(Long classroomId, Pageable pageable);

    // [woo] 학급별 퀴즈 전체 (학부모용)
    @Query("SELECT q FROM Quiz q WHERE q.classroom.cid = :classroomId AND q.isDeleted = false ORDER BY q.createDate DESC")
    List<Quiz> findAllByClassroomId(@Param("classroomId") Long classroomId);

}
