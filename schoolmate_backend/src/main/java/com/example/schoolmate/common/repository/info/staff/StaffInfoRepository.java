package com.example.schoolmate.common.repository.info.staff;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.StaffInfo;

public interface StaffInfoRepository extends JpaRepository<StaffInfo, Long>, StaffInfoRepositoryCustom {
    boolean existsByCode(String code);

    // 학교 범위 내 사번 중복 체크
    boolean existsByCodeAndSchoolId(String code, Long schoolId);

    // 학교 소속 교직원 전체 조회 (공지 알림용)
    List<StaffInfo> findBySchoolId(Long schoolId);

    // 다중 역할 인스턴스 지원
    List<StaffInfo> findAllByUserUid(Long uid);

    // primary 인스턴스 조회
    Optional<StaffInfo> findByUserUidAndPrimaryTrue(Long uid);
}