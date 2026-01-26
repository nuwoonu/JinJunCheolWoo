package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.parkjoon.entity.Classroom;

public interface StudentInfoRepository extends JpaRepository<StudentInfo, Long> {
    // 특정 유저(User)의 학생 정보 찾기
    Optional<StudentInfo> findByUser(User user);

    Optional<StudentInfo> findByStudentNumber(Long studentNumber);

    // email은 User 엔티티에 있으므로 연관관계를 통해 조회
    @Query("SELECT s FROM StudentInfo s WHERE s.user.email = :email")
    Optional<StudentInfo> findByUserEmail(@Param("email") String email);

    // Classroom 기반 조회 메서드
    List<StudentInfo> findByClassroom(Classroom classroom);

    List<StudentInfo> findByClassroomGrade(int grade);

    List<StudentInfo> findByClassroomClassNum(int classNum);

    List<StudentInfo> findByClassroomGradeAndClassroomClassNum(int grade, int classNum);

}