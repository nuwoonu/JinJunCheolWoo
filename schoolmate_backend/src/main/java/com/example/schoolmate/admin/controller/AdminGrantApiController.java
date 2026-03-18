package com.example.schoolmate.admin.controller;

import com.example.schoolmate.common.entity.user.SchoolAdminGrant;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.GrantedRole;
import com.example.schoolmate.common.repository.SchoolAdminGrantRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import lombok.RequiredArgsConstructor;
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
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_GRANTS)
@RequiredArgsConstructor
@PreAuthorize("@grants.isSuperAdmin()")
public class AdminGrantApiController {

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolAdminGrantRepository grantRepository;

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
        }
        return ResponseEntity.ok().build();
    }

    /** SchoolAdminGrant 회수 */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> removeGrant(@PathVariable Long id) {
        if (!grantRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "권한을 찾을 수 없습니다.");
        }
        grantRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
