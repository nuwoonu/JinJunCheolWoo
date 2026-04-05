package com.example.schoolmate.domain.user.repository;

import com.example.schoolmate.domain.user.entity.RoleRequest;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.RoleRequestStatus;
import com.example.schoolmate.domain.user.entity.constant.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRequestRepository extends JpaRepository<RoleRequest, Long> {

    /** 특정 유저의 모든 역할 신청 목록 */
    List<RoleRequest> findByUser(User user);

    /** 특정 유저 + 역할의 신청 목록 (학교 무관, 여러 건 가능) */
    List<RoleRequest> findAllByUserAndRole(User user, UserRole role);

    /** 특정 유저 + 역할 + 학교 — 단일 결과 보장 (STUDENT/TEACHER 학교 별) */
    Optional<RoleRequest> findByUserAndRoleAndSchoolId(User user, UserRole role, Long schoolId);

    /** 특정 유저 + 역할 (schoolId=null, PARENT 등) */
    Optional<RoleRequest> findByUserAndRoleAndSchoolIdIsNull(User user, UserRole role);

    /** 특정 유저 + 역할 + 상태 */
    Optional<RoleRequest> findByUserAndRoleAndStatus(User user, UserRole role, RoleRequestStatus status);

    /** 특정 유저가 해당 역할로 신청 중인지 (PENDING or ACTIVE) */
    boolean existsByUserAndRoleAndStatusIn(User user, UserRole role, List<RoleRequestStatus> statuses);

    /** 같은 (user, role, schoolId) 조합 존재 여부 — schoolId 있는 역할용 */
    boolean existsByUserAndRoleAndSchoolId(User user, UserRole role, Long schoolId);

    /** 같은 (user, role) 조합 존재 여부 — schoolId가 null인 역할(PARENT 등)용 */
    boolean existsByUserAndRoleAndSchoolIdIsNull(User user, UserRole role);

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
