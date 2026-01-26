package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.TeacherInfo;

public interface TeacherInfoRepository extends JpaRepository<TeacherInfo, Long> {
    List<TeacherInfo> findBySubject(String subject);

    boolean existsByCode(String code);

    // User ID로 교사 정보 조회
    Optional<TeacherInfo> findByUserUid(Long uid);
}