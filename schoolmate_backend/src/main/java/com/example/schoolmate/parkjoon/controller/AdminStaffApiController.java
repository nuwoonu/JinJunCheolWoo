package com.example.schoolmate.parkjoon.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.dto.StaffDTO;
import com.example.schoolmate.common.service.StaffService;

import lombok.RequiredArgsConstructor;

// 교직원 관리 REST API
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_STAFFS)
@RequiredArgsConstructor
public class AdminStaffApiController {

    private final StaffService staffService;

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
    public ResponseEntity<Void> create(@RequestBody StaffDTO.CreateRequest request) {
        try {
            staffService.createStaff(request);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/import-csv")
    public ResponseEntity<String> importCsv(@RequestParam MultipartFile file) {
        try {
            staffService.importStaffsFromCsv(file);
            return ResponseEntity.ok("등록되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
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
