package com.example.schoolmate.admin.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.cheol.dto.SubjectDTO;
import com.example.schoolmate.common.service.SubjectService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;

// 교과목 관리 REST API
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_SUBJECTS)
@RequiredArgsConstructor
public class AdminSubjectApiController {

    private final SubjectService subjectService;

    /** 과목 목록 조회 — 교사 등록·수정 폼 드롭다운용으로 일반 어드민도 읽기 허용 */
    @GetMapping
    @PreAuthorize("@grants.canAccessAdmin()")
    public ResponseEntity<List<?>> list() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @PostMapping
    @PreAuthorize("@grants.isSuperAdmin()")
    public ResponseEntity<Void> create(@RequestBody SubjectDTO.Request request) {
        subjectService.createSubject(request);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    @PreAuthorize("@grants.isSuperAdmin()")
    public ResponseEntity<Void> update(@RequestBody SubjectDTO.Request request) {
        subjectService.updateSubject(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("@grants.isSuperAdmin()")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        subjectService.deleteSubject(code);
        return ResponseEntity.ok().build();
    }
}
