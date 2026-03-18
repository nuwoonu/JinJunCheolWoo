package com.example.schoolmate.admin.controller;

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
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.service.TeacherService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;

// 교사 관리 REST API
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_TEACHERS)
@RequiredArgsConstructor
@PreAuthorize("@grants.canAccessAdmin()")
public class AdminTeacherApiController {

    private final TeacherService teacherService;

    @GetMapping
    public ResponseEntity<Page<TeacherDTO.DetailResponse>> list(
            TeacherDTO.TeacherSearchCondition condition,
            @PageableDefault(size = 10, sort = "uid", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(teacherService.getTeacherList(condition, pageable));
    }

    @GetMapping("/{uid}")
    public ResponseEntity<TeacherDTO.DetailResponse> detail(@PathVariable Long uid) {
        return ResponseEntity.ok(teacherService.getTeacherDetail(uid));
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody TeacherDTO.CreateRequest request) {
        try {
            teacherService.createTeacher(request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{uid}")
    public ResponseEntity<Void> update(@PathVariable Long uid, @RequestBody TeacherDTO.UpdateRequest request) {
        request.setUid(uid);
        teacherService.updateTeacher(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-status")
    public ResponseEntity<String> bulkStatus(@RequestParam List<Long> uids, @RequestParam String status) {
        try {
            teacherService.bulkUpdateTeacherStatus(uids, status);
            return ResponseEntity.ok("상태 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/import-csv")
    public ResponseEntity<String> importCsv(@RequestParam MultipartFile file) {
        try {
            teacherService.importTeachersFromCsv(file);
            return ResponseEntity.ok("등록되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/{uid}/role")
    public ResponseEntity<Void> addRole(@PathVariable Long uid, @RequestParam String role) {
        teacherService.addRole(uid, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{uid}/role")
    public ResponseEntity<Void> removeRole(@PathVariable Long uid, @RequestParam String role) {
        teacherService.removeRole(uid, role);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> departments() {
        return ResponseEntity.ok(List.of("교무부", "학생부", "연구부", "진로진학부", "환경부", "체육부"));
    }

    @GetMapping("/positions")
    public ResponseEntity<List<String>> positions() {
        return ResponseEntity.ok(List.of("교장", "교감", "수석교사", "부장교사", "평교사", "기간제교사"));
    }
}
