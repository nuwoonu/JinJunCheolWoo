package com.example.schoolmate.common.repository.info.teacher;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.TeacherInfo;

public interface TeacherInfoRepository extends JpaRepository<TeacherInfo, Long>, TeacherInfoRepositoryCustom {
    List<TeacherInfo> findBySubjectCode(String subjectCode);

    boolean existsByCode(String code);

    // 학교 범위 내 사번 중복 체크
    boolean existsByCodeAndSchoolId(String code, Long schoolId);

    // User ID로 교사 정보 조회 (단건 — 단일 소속 또는 하위 호환용)
    Optional<TeacherInfo> findByUserUid(Long uid);

    // 다중 역할 인스턴스 지원
    List<TeacherInfo> findAllByUserUid(Long uid);

    // primary 인스턴스 조회
    Optional<TeacherInfo> findByUserUidAndPrimaryTrue(Long uid);

    // 학교 소속 교사 전체 조회 (공지 알림용)
    List<TeacherInfo> findBySchoolId(Long schoolId);

    // 학교 + 코드 접두어로 최신 코드 조회 (순번 자동 생성용)
    List<TeacherInfo> findBySchoolIdAndCodeStartingWithOrderByCodeDesc(Long schoolId, String prefix, Pageable pageable);
}