package com.example.schoolmate.common.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.User;

public interface StudentInfoRepository extends JpaRepository<StudentInfo, Long> {
    // 특정 유저(User)의 학생 정보 찾기
    Optional<StudentInfo> findByUser(User user);
}