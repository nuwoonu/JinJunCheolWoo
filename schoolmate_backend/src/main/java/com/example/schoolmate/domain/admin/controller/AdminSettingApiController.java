package com.example.schoolmate.domain.admin.controller;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.service.AcademicTermService;
import com.example.schoolmate.global.config.SchoolmateUrls;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 학기 관리 REST API
 *
 * AcademicTerm 엔티티를 직접 직렬화하면 Hibernate 지연 로딩 프록시(school 필드) 직렬화 오류가 발생하므로
 * 모든 응답은 Map DTO로 변환하여 반환합니다.
 *
 * - GET  /admin/settings        : 현재 활성 학기 조회
 * - POST /admin/settings        : 새 학기 개설 및 활성화 (기존 ACTIVE → CLOSED)
 * - GET  /admin/settings/history: 전체 학기 이력 조회
 * - POST /admin/settings/{id}/close : 특정 학기 종료
 */
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_SETTINGS)
@RequiredArgsConstructor
@PreAuthorize("@grants.isSchoolAdmin()")
public class AdminSettingApiController {

    private final AcademicTermService academicTermService;

    /** 현재 활성 학기 조회 (대시보드용으로 모든 어드민 grant 허용) */
    @PreAuthorize("@grants.canAccessAdmin()")
    @GetMapping
    public ResponseEntity<Map<String, Object>> get() {
        return ResponseEntity.ok(toDto(academicTermService.getCurrentTerm()));
    }

    /**
     * 새 학기 개설 및 활성화
     * 기존 ACTIVE 학기는 자동으로 CLOSED 처리됩니다.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> open(
            @RequestParam int year,
            @RequestParam int semester,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        log.info("학기 개설: {}학년도 {}학기", year, semester);
        AcademicTerm term = academicTermService.openTerm(year, semester, startDate, endDate);
        return ResponseEntity.ok(toDto(term));
    }

    /** 전체 학기 이력 조회 (최신순) */
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> history() {
        List<Map<String, Object>> result = academicTermService.getTermHistory().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** 특정 학기 종료 처리 */
    @PostMapping("/{id}/close")
    public ResponseEntity<Void> close(@PathVariable Long id) {
        log.info("학기 종료: id={}", id);
        academicTermService.closeTerm(id);
        return ResponseEntity.ok().build();
    }

    /** AcademicTerm 엔티티 → Map DTO (school 등 Hibernate 프록시 필드 제외) */
    private Map<String, Object> toDto(AcademicTerm term) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", term.getId());
        m.put("schoolYear", term.getSchoolYearInt());
        m.put("semester", term.getSemester());
        m.put("startDate", term.getStartDate());
        m.put("endDate", term.getEndDate());
        m.put("status", term.getStatus());
        m.put("displayName", term.getDisplayName());
        return m;
    }
}
