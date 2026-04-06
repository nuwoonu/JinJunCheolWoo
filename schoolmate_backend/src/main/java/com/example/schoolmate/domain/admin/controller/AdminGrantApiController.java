package com.example.schoolmate.domain.admin.controller;

import com.example.schoolmate.domain.notification.service.NotificationService;
import com.example.schoolmate.domain.user.entity.SchoolAdminGrant;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.GrantedRole;
import com.example.schoolmate.domain.user.repository.SchoolAdminGrantRepository;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.global.config.SchoolmateUrls;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 위임 권한(SchoolAdminGrant) CRUD API
 * SUPER_ADMIN 전용
 */
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_GRANTS)
@RequiredArgsConstructor
@PreAuthorize("@grants.isSuperAdmin()")
public class AdminGrantApiController {

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolAdminGrantRepository grantRepository;
    private final NotificationService notificationService;

    /** 현재 로그인한 ADMIN 유저 조회 */
    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUserDTO dto)) return null;
        return userRepository.findById(dto.getCustomUserDTO().getUid()).orElse(null);
    }

    /** 특정 유저의 SchoolAdminGrant 목록 조회 */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getUserGrants(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다."));
        List<SchoolAdminGrant> grants = grantRepository.findByUser(user);

        List<Map<String, Object>> result = new ArrayList<>();
        for (SchoolAdminGrant g : grants) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", g.getId());
            m.put("grantedRole", g.getGrantedRole().name());
            m.put("grantedRoleDescription", g.getGrantedRole().getDescription());
            m.put("schoolId", g.getSchool().getId());
            m.put("schoolName", g.getSchool().getName());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    /** SchoolAdminGrant 부여 */
    @PostMapping
    @Transactional
    public ResponseEntity<Void> addGrant(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        Long schoolId = Long.valueOf(body.get("schoolId").toString());
        String roleName = body.get("grantedRole").toString();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다."));
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "학교를 찾을 수 없습니다."));

        GrantedRole role;
        try {
            role = GrantedRole.valueOf(roleName);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 권한입니다: " + roleName);
        }
        // SUPER_ADMIN은 DB에 저장하지 않음 (UserRole.ADMIN이 슈퍼 어드민)
        if (role == GrantedRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SUPER_ADMIN은 부여할 수 없습니다.");
        }

        if (!grantRepository.existsByUserAndSchool_IdAndGrantedRole(user, schoolId, role)) {
            grantRepository.save(new SchoolAdminGrant(user, school, role, getCurrentUser()));
            log.info("관리자 권한 부여: userId={}, schoolId={}, role={}", userId, schoolId, role);
            notificationService.notifyUser(
                    getCurrentUser(),
                    user,
                    "[권한 부여] " + role.getDescription(),
                    school.getName() + "의 " + role.getDescription() + " 권한이 부여되었습니다.",
                    "/admin/dashboard"
            );
        }
        return ResponseEntity.ok().build();
    }

    /** SchoolAdminGrant 회수 */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> removeGrant(@PathVariable Long id) {
        SchoolAdminGrant grant = grantRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "권한을 찾을 수 없습니다."));
        User receiver = grant.getUser();
        String schoolName = grant.getSchool().getName();
        String roleDesc = grant.getGrantedRole().getDescription();
        grantRepository.delete(grant);
        log.info("관리자 권한 회수: grantId={}", id);
        notificationService.notifyUser(
                getCurrentUser(),
                receiver,
                "[권한 회수] " + roleDesc,
                schoolName + "의 " + roleDesc + " 권한이 회수되었습니다.",
                null
        );
        return ResponseEntity.ok().build();
    }
}
