package com.example.schoolmate.domain.admin.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.global.config.SchoolmateUrls;
import com.example.schoolmate.domain.staff.dto.StaffDTO;
import com.example.schoolmate.domain.staff.service.StaffService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;

// 교직원 관리 REST API
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_STAFFS)
@RequiredArgsConstructor
@PreAuthorize("@grants.canManageStaffs()")
public class AdminStaffApiController {

    private final StaffService staffService;

    @PreAuthorize("@grants.canAccessAdmin()")
    @GetMapping
    public ResponseEntity<Page<StaffDTO.DetailResponse>> list(
            StaffDTO.StaffSearchCondition condition,
            @PageableDefault(size = 10, sort = "uid", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(staffService.getStaffList(condition, pageable));
    }

    @GetMapping("/{uid}")
    public ResponseEntity<StaffDTO.DetailResponse> detail(@PathVariable Long uid) {
        return ResponseEntity.ok(staffService.getStaffDetail(uid));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody StaffDTO.CreateRequest request) {
        try {
            staffService.createStaff(request);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("교직원 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{uid}")
    public ResponseEntity<Void> update(@PathVariable Long uid, @RequestBody StaffDTO.UpdateRequest request) {
        request.setUid(uid);
        staffService.updateStaff(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-status")
    public ResponseEntity<String> bulkStatus(@RequestParam List<Long> uids, @RequestParam String status) {
        try {
            staffService.bulkUpdateStaffStatus(uids, status);
            return ResponseEntity.ok("상태 변경되었습니다.");
        } catch (Exception e) {
            log.error("교직원 일괄 상태 변경 실패: uids={}, status={}, msg={}", uids, status, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/import-csv")
    public ResponseEntity<List<String>> importCsv(@RequestParam MultipartFile file) {
        try {
            List<String> errors = staffService.importStaffsFromCsv(file);
            return ResponseEntity.ok(errors);
        } catch (Exception e) {
            log.error("교직원 CSV 가져오기 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of("CSV 처리 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @PostMapping("/{uid}/role")
    public ResponseEntity<Void> addRole(@PathVariable Long uid, @RequestParam String role) {
        staffService.addRole(uid, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{uid}/role")
    public ResponseEntity<Void> removeRole(@PathVariable Long uid, @RequestParam String role) {
        staffService.removeRole(uid, role);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> departments() {
        return ResponseEntity.ok(List.of("행정실", "시설관리실", "급식실", "전산실", "당직실", "기타"));
    }
}
