package com.example.schoolmate.common.repository;

import com.example.schoolmate.common.entity.user.SchoolAdminGrant;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.GrantedRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SchoolAdminGrantRepository extends JpaRepository<SchoolAdminGrant, Long> {

    /** 특정 유저의 모든 위임 권한 조회 */
    List<SchoolAdminGrant> findByUser(User user);

    /** 특정 유저 + 특정 학교의 위임 권한 목록 조회 */
    List<SchoolAdminGrant> findByUserAndSchool_Id(User user, Long schoolId);

    /** 특정 유저 + 특정 학교 + 특정 역할 보유 여부 (권한 체크용) */
    boolean existsByUserAndSchool_IdAndGrantedRole(User user, Long schoolId, GrantedRole grantedRole);

    /** 특정 유저가 어떤 학교에서든 위임 권한을 하나라도 가지고 있는지 (Hub 어드민 접근 표시용) */
    boolean existsByUser(User user);

    /** 특정 학교에 부여된 권한 전체 조회 (ADMIN 관리 화면용) */
    List<SchoolAdminGrant> findBySchool_Id(Long schoolId);

    /** 특정 학교에서 특정 역할들 보유자 조회 (알림 발송용) */
    List<SchoolAdminGrant> findBySchool_IdAndGrantedRoleIn(Long schoolId, List<GrantedRole> roles);

    /** 역할 목록으로 보유자 전체 조회 — 학교 무관 (학부모 가입 알림 등) */
    List<SchoolAdminGrant> findByGrantedRoleIn(List<GrantedRole> roles);
}
