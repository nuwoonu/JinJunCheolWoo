package com.example.schoolmate.common.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.AdminEntity;
import com.example.schoolmate.common.entity.constant.ApprovalStatus;

public interface AdminRepository extends JpaRepository<AdminEntity, Long> {
    // Admin 신청 필터링된 관리자 리스트
    // List<AdminEntity> findByApprovalStatus(ApprovalStatus status);

    // 페이지 표시
    // Page<AdminEntity> findByApprovalStatus(ApprovalStatus status, Pageable
    // pageable);

    // Admin계정 신청된 관리자 수 카운팅
    // long countByApprovalStatus(ApprovalStatus status);

}
