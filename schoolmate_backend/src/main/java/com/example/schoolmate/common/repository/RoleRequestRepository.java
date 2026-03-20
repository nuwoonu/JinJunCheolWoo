package com.example.schoolmate.common.repository;

import com.example.schoolmate.common.entity.user.RoleRequest;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.RoleRequestStatus;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRequestRepository extends JpaRepository<RoleRequest, Long> {

    /** 특정 유저의 모든 역할 신청 목록 */
    List<RoleRequest> findByUser(User user);

    /** 특정 유저 + 역할의 신청 조회 (중복 신청 체크용) */
    Optional<RoleRequest> findByUserAndRole(User user, UserRole role);

    /** 특정 유저 + 역할 + 상태 */
    Optional<RoleRequest> findByUserAndRoleAndStatus(User user, UserRole role, RoleRequestStatus status);

    /** 특정 유저가 해당 역할로 신청 중인지 (PENDING or ACTIVE) */
    boolean existsByUserAndRoleAndStatusIn(User user, UserRole role, List<RoleRequestStatus> statuses);

    /** 학교별 대기 중인 신청 목록 (어드민 관리용) */
    Page<RoleRequest> findBySchoolIdAndStatus(Long schoolId, RoleRequestStatus status, Pageable pageable);

    /** 전체 대기 중인 신청 목록 (최고 어드민용) */
    Page<RoleRequest> findByStatus(RoleRequestStatus status, Pageable pageable);

    /** 특정 역할의 대기 신청 목록 */
    Page<RoleRequest> findByRoleAndStatus(UserRole role, RoleRequestStatus status, Pageable pageable);

    /** 역할별 특정 상태 건수 */
    long countByRoleAndStatus(UserRole role, RoleRequestStatus status);

    /** 역할별 특정 상태 건수 (학교 필터) */
    long countByRoleAndStatusAndSchoolId(UserRole role, RoleRequestStatus status, Long schoolId);
}
