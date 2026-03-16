package com.example.schoolmate.common.repository.info.teacher;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.TeacherInfo;

public interface TeacherInfoRepository extends JpaRepository<TeacherInfo, Long>, TeacherInfoRepositoryCustom {
    List<TeacherInfo> findBySubject(String subject);

    boolean existsByCode(String code);

    // 학교 범위 내 사번 중복 체크
    boolean existsByCodeAndSchoolId(String code, Long schoolId);

    // User ID로 교사 정보 조회
    Optional<TeacherInfo> findByUserUid(Long uid);
}