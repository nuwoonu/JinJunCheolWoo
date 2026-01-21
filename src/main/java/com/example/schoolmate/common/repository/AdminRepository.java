package com.example.schoolmate.common.repository;

// import java.util.List;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.jpa.repository.JpaRepository;
// import com.example.schoolmate.common.entity.AdminEntity;
// import com.example.schoolmate.common.entity.constant.ApprovalStatus;

/**
 * [Deprecated] AdminRepository
 * 새 구조에서는 Admin이 User의 역할(Role)로 관리됨
 * AdminEntity도 @Entity가 비활성화되어 있음
 *
 * 필요시 StaffInfo 기반으로 재구현
 */
// public interface AdminRepository extends JpaRepository<AdminEntity, Long> {
//     // Admin 신청 필터링된 관리자 리스트
//     // List<AdminEntity> findByApprovalStatus(ApprovalStatus status);
//
//     // 페이지 표시
//     // Page<AdminEntity> findByApprovalStatus(ApprovalStatus status, Pageable pageable);
//
//     // Admin계정 신청된 관리자 수 카운팅
//     // long countByApprovalStatus(ApprovalStatus status);
// }
