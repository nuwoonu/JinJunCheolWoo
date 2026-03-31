package com.example.schoolmate.common.security;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.GrantedRole;
import com.example.schoolmate.common.repository.SchoolAdminGrantRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * GrantedRole 기반 권한 체크 유틸 (SpEL 빈 참조용: @grants)
 *
 * SecurityConfig의 .access(new
 * WebExpressionAuthorizationManager("@grants.canAccessAdmin()"))
 * 또는 컨트롤러의 @PreAuthorize("@grants.hasGrant(#schoolId, 'SCHOOL_ADMIN')") 형태로 사용.
 *
 * - isSuperAdmin() : UserRole.ADMIN 보유 여부 (슈퍼 어드민)
 * - canAccessAdmin() : 어드민 페이지 진입 가능 여부 (ADMIN role OR 임의의 SchoolAdminGrant 보유)
 * - hasGrant(schoolId, roleName) : 특정 학교 + 특정 GrantedRole 보유 여부 (ADMIN은 항상
 * true)
 * - hasAnyGrant(schoolId) : 특정 학교 임의의 GrantedRole 보유 여부 (ADMIN은 항상 true)
 */
@Service("grants")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GrantPermissionChecker {

    private final UserRepository userRepository;
    private final SchoolAdminGrantRepository grantRepository;

    /** 현재 요청의 Spring Security Principal(AuthUserDTO) 반환 */
    private AuthUserDTO getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return null;
        Object principal = auth.getPrincipal();
        return (principal instanceof AuthUserDTO dto) ? dto : null;
    }

    /** Principal에서 DB User 조회 */
    private User getCurrentDbUser() {
        AuthUserDTO principal = getCurrentPrincipal();
        if (principal == null)
            return null;
        Long uid = principal.getCustomUserDTO().getUid();
        return userRepository.findById(uid).orElse(null);
    }

    /**
     * 슈퍼 어드민 여부 (UserRole.ADMIN 보유)
     * — 슈퍼 어드민은 모든 학교·권한에 자동으로 접근 가능
     */
    public boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    /**
     * 어드민 페이지 진입 가능 여부
     * ADMIN role 보유 OR SchoolAdminGrant가 하나라도 있으면 true
     */
    public boolean canAccessAdmin() {
        if (isSuperAdmin())
            return true;
        User user = getCurrentDbUser();
        return user != null && grantRepository.existsByUser(user);
    }

    /**
     * 특정 학교 + 특정 권한 보유 여부
     * 슈퍼 어드민(ADMIN role)은 schoolId에 관계없이 항상 true
     */
    public boolean hasGrant(Long schoolId, String roleName) {
        if (isSuperAdmin())
            return true;
        User user = getCurrentDbUser();
        if (user == null)
            return false;
        try {
            GrantedRole role = GrantedRole.valueOf(roleName);
            return grantRepository.existsByUserAndSchool_IdAndGrantedRole(user, schoolId, role);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * 특정 학교에서 임의의 GrantedRole 보유 여부
     * 슈퍼 어드민은 항상 true
     */
    public boolean hasAnyGrant(Long schoolId) {
        if (isSuperAdmin())
            return true;
        User user = getCurrentDbUser();
        if (user == null)
            return false;
        return !grantRepository.findByUserAndSchool_Id(user, schoolId).isEmpty();
    }

    // =========================================================================
    // 기능별 Named 권한 체크 메서드 (컨트롤러 @PreAuthorize 에서 사용)
    //
    // 규칙: isSuperAdmin() 또는 SCHOOL_ADMIN grant → 해당 학교 모든 기능 접근 허용
    // 개별 GrantedRole → 특정 기능만 허용
    //
    // 상수처럼 한 곳에서 관리하여 GrantedRole 변경 시 이곳만 수정하면 됨.
    // =========================================================================

    /** 학교 무관으로 특정 역할 보유 여부 (내부 헬퍼) */
    private boolean hasRoleInAnySchool(GrantedRole role) {
        User user = getCurrentDbUser();
        return user != null && grantRepository.existsByUserAndGrantedRole(user, role);
    }

    /** SCHOOL_ADMIN 이상 권한 보유 여부 (SUPER_ADMIN 포함) */
    public boolean isSchoolAdmin() {
        return isSuperAdmin() || hasRoleInAnySchool(GrantedRole.SCHOOL_ADMIN);
    }

    /** 학생 관리 (STUDENT_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageStudents() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.STUDENT_MANAGER);
    }

    /** 교사 관리 (TEACHER_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageTeachers() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.TEACHER_MANAGER);
    }

    /** 교직원 관리 (STAFF_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageStaffs() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.STAFF_MANAGER);
    }

    /** 학부모 관리 (PARENT_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageParents() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.PARENT_MANAGER);
    }

    /** 학급 관리 (CLASS_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageClasses() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.CLASS_MANAGER);
    }

    /** 공지 관리 (NOTICE_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageNotices() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.NOTICE_MANAGER);
    }

    /** 일정 관리 (SCHEDULE_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageSchedule() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.SCHEDULE_MANAGER);
    }

    /** 시설 관리 (FACILITY_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageFacilities() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.FACILITY_MANAGER);
    }

    /** 기자재 관리 (ASSET_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageAssets() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.ASSET_MANAGER);
    }

    /** 기숙사 관리 (DORMITORY_MANAGER 또는 SCHOOL_ADMIN 이상) */
    public boolean canManageDormitory() {
        return isSchoolAdmin() || hasRoleInAnySchool(GrantedRole.DORMITORY_MANAGER);
    }
}
