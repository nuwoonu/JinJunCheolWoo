package com.example.schoolmate.domain.admin.controller;

import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.UserRole;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.domain.user.service.RoleRequestService;
import com.example.schoolmate.global.config.SchoolmateUrls;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_ROLE_REQUESTS)
@RequiredArgsConstructor
@PreAuthorize("@grants.canAccessAdmin()")
public class AdminRoleRequestApiController {

    private final RoleRequestService roleRequestService;
    private final UserRepository userRepository;

    /** 역할별 상태별 건수 조회 (대시보드용) */
    @GetMapping("/counts")
    public ResponseEntity<?> counts(@RequestParam String role) {
        return ResponseEntity.ok(roleRequestService.getCountsByRole(UserRole.valueOf(role), SchoolContextHolder.getSchoolId()));
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
        log.info("역할 신청 승인 요청: requestId={}, reviewerUid={}", id, reviewer.getUid());
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
        log.info("역할 신청 거절 요청: requestId={}, reviewerUid={}, reason={}", id, reviewer.getUid(), reason);
        roleRequestService.reject(id, reviewer, reason);
        return ResponseEntity.ok(Map.of("message", "거절되었습니다."));
    }

    /** 정지 */
    @PostMapping("/{id}/suspend")
    public ResponseEntity<?> suspend(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        User reviewer = getReviewer(authUser);
        log.info("역할 정지 요청: requestId={}, reviewerUid={}", id, reviewer.getUid());
        roleRequestService.suspend(id, reviewer);
        return ResponseEntity.ok(Map.of("message", "정지되었습니다."));
    }

    private User getReviewer(AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        return userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("리뷰어를 찾을 수 없습니다."));
    }
}
