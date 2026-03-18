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
 * SecurityConfig의 .access(new WebExpressionAuthorizationManager("@grants.canAccessAdmin()"))
 * 또는 컨트롤러의 @PreAuthorize("@grants.hasGrant(#schoolId, 'SCHOOL_ADMIN')") 형태로 사용.
 *
 * - isSuperAdmin()   : UserRole.ADMIN 보유 여부 (슈퍼 어드민)
 * - canAccessAdmin() : 어드민 페이지 진입 가능 여부 (ADMIN role OR 임의의 SchoolAdminGrant 보유)
 * - hasGrant(schoolId, roleName) : 특정 학교 + 특정 GrantedRole 보유 여부 (ADMIN은 항상 true)
 * - hasAnyGrant(schoolId)        : 특정 학교 임의의 GrantedRole 보유 여부 (ADMIN은 항상 true)
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
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        return (principal instanceof AuthUserDTO dto) ? dto : null;
    }

    /** Principal에서 DB User 조회 */
    private User getCurrentDbUser() {
        AuthUserDTO principal = getCurrentPrincipal();
        if (principal == null) return null;
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
        if (isSuperAdmin()) return true;
        User user = getCurrentDbUser();
        return user != null && grantRepository.existsByUser(user);
    }

    /**
     * 특정 학교 + 특정 권한 보유 여부
     * 슈퍼 어드민(ADMIN role)은 schoolId에 관계없이 항상 true
     */
    public boolean hasGrant(Long schoolId, String roleName) {
        if (isSuperAdmin()) return true;
        User user = getCurrentDbUser();
        if (user == null) return false;
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
        if (isSuperAdmin()) return true;
        User user = getCurrentDbUser();
        if (user == null) return false;
        return !grantRepository.findByUserAndSchool_Id(user, schoolId).isEmpty();
    }
}
