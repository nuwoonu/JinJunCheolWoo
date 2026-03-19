package com.example.schoolmate.admin.controller;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.service.RoleRequestService;
import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.dto.AuthUserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 역할 신청 관리 REST API (어드민용)
 *
 * - GET  /api/admin/role-requests         : 전체 PENDING 목록
 * - GET  /api/admin/role-requests/school  : 학교별 PENDING 목록 (schoolId 파라미터)
 * - POST /api/admin/role-requests/{id}/approve : 승인
 * - POST /api/admin/role-requests/{id}/reject  : 거절
 */
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_ROLE_REQUESTS)
@RequiredArgsConstructor
public class AdminRoleRequestApiController {

    private final RoleRequestService roleRequestService;
    private final UserRepository userRepository;

    /** 역할별 상태별 건수 조회 (대시보드용) */
    @GetMapping("/counts")
    public ResponseEntity<?> counts(@RequestParam String role) {
        return ResponseEntity.ok(roleRequestService.getCountsByRole(UserRole.valueOf(role)));
    }

    /** 전체 PENDING 신청 목록 (최고 어드민용) */
    @GetMapping
    public ResponseEntity<?> listAll(
            @RequestParam(required = false) String role,
            @PageableDefault(size = 20) Pageable pageable) {
        if (role != null && !role.isBlank()) {
            return ResponseEntity.ok(roleRequestService.getPendingByRole(UserRole.valueOf(role), pageable));
        }
        return ResponseEntity.ok(roleRequestService.getAllPending(pageable));
    }

    /** 학교별 PENDING 신청 목록 */
    @GetMapping("/school")
    public ResponseEntity<Page<?>> listBySchool(
            @RequestParam Long schoolId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(roleRequestService.getPendingBySchool(schoolId, pageable));
    }

    /** 승인 */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        User reviewer = getReviewer(authUser);
        roleRequestService.approve(id, reviewer);
        return ResponseEntity.ok(Map.of("message", "승인되었습니다."));
    }

    /** 거절 */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        String reason = body.getOrDefault("reason", "");
        User reviewer = getReviewer(authUser);
        roleRequestService.reject(id, reviewer, reason);
        return ResponseEntity.ok(Map.of("message", "거절되었습니다."));
    }

    /** 정지 */
    @PostMapping("/{id}/suspend")
    public ResponseEntity<?> suspend(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        User reviewer = getReviewer(authUser);
        roleRequestService.suspend(id, reviewer);
        return ResponseEntity.ok(Map.of("message", "정지되었습니다."));
    }

    private User getReviewer(AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        return userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("리뷰어를 찾을 수 없습니다."));
    }
}
