package com.example.schoolmate.homework.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.homework.entity.Homework;
import com.example.schoolmate.homework.entity.HomeworkStatus;

/**
 * [woo] 과제 Repository
 */
public interface HomeworkRepository extends JpaRepository<Homework, Long> {

    // [woo] 학급별 과제 목록 (학생이 자기 학급 과제 조회)
    @Query("SELECT h FROM Homework h WHERE h.courseSection.classroom.cid = :classroomId AND h.isDeleted = false ORDER BY h.createDate DESC")
    Page<Homework> findByClassroomId(@Param("classroomId") Long classroomId, Pageable pageable);

    // [woo] 교사가 출제한 과제 목록
    @Query("SELECT h FROM Homework h WHERE h.courseSection.teacher.id = :teacherInfoId AND h.isDeleted = false ORDER BY h.createDate DESC")
    Page<Homework> findByTeacherInfoId(@Param("teacherInfoId") Long teacherInfoId, Pageable pageable);

    // [woo] 학급별 + 상태별 과제 조회
    @Query("SELECT h FROM Homework h WHERE h.courseSection.classroom.cid = :classroomId AND h.status = :status AND h.isDeleted = false ORDER BY h.createDate DESC")
    Page<Homework> findByClassroomIdAndStatus(@Param("classroomId") Long classroomId, @Param("status") HomeworkStatus status, Pageable pageable);

    // [woo] 특정 학생의 학급에 해당하는 과제 목록 (학부모 조회용)
    @Query("SELECT h FROM Homework h WHERE h.courseSection.classroom.cid = :classroomId AND h.isDeleted = false ORDER BY h.createDate DESC")
    List<Homework> findAllByClassroomId(@Param("classroomId") Long classroomId);

}
