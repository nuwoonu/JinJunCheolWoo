package com.example.schoolmate.admin.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.school.dto.SchoolDTO;
import com.example.schoolmate.domain.school.service.NeisService;
import com.example.schoolmate.domain.school.service.SchoolService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;

@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_SCHOOLS)
@RequiredArgsConstructor
@PreAuthorize("@grants.isSuperAdmin()")
public class AdminSchoolApiController {

    private final NeisService neisService;
    private final SchoolService schoolService;

    // ── 학교 목록 검색 ─────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<SchoolDTO.Summary>> searchSchools(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String schoolKind,
            @RequestParam(required = false) String officeOfEducation,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(schoolService.searchSchools(name, schoolKind, officeOfEducation, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SchoolDTO.Detail> getSchool(@PathVariable Long id) {
        return ResponseEntity.ok(schoolService.getSchool(id));
    }

    // ── NEIS 동기화 ────────────────────────────────────────

    @GetMapping("/sync/status")
    public ResponseEntity<Map<String, Boolean>> getSyncStatus() {
        return ResponseEntity.ok(Map.of("syncing", neisService.isSyncRunning()));
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> syncSchools(Principal principal) {
        if (neisService.isSyncRunning()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        String adminName = (principal != null) ? principal.getName() : "Unknown Admin";
        log.info("NEIS 학교 데이터 동기화 시작: admin={}", adminName);
        neisService.syncSchoolData(adminName);
        return ResponseEntity.ok().build();
    }
}
