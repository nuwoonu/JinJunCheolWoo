package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.User;

public interface StudentInfoRepository extends JpaRepository<StudentInfo, Long> {
    // 특정 유저(User)의 학생 정보 찾기
    Optional<StudentInfo> findByUser(User user);

    Optional<StudentInfo> findByStudentNumber(Long studentNumber);

    // email은 User 엔티티에 있으므로 연관관계를 통해 조회
    @Query("SELECT s FROM StudentInfo s WHERE s.user.email = :email")
    Optional<StudentInfo> findByUserEmail(@Param("email") String email);

    List<StudentInfo> findByGrade(int grade);

    List<StudentInfo> findByClassNum(int classNum);

    @Query("SELECT s FROM StudentInfo s JOIN FETCH s.grades WHERE s.id = :id")
    Optional<StudentInfo> findByIdWithGrades(@Param("id") Long id);

    Optional<StudentInfo> findByYear(com.example.schoolmate.common.entity.user.constant.Year year);

}