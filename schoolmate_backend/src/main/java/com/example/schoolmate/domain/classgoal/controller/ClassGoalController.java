package com.example.schoolmate.domain.classgoal.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.user.dto.AuthUserDTO;
import com.example.schoolmate.domain.classgoal.dto.ClassGoalDTO;
import com.example.schoolmate.domain.classgoal.service.ClassGoalService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [soojin] 이달의 학급 목표 REST API
 * GET  /api/class/goal/{classroomId}?year=&month=  → 조회 (학생/교사/학부모)
 * POST /api/class/goal/{classroomId}?year=&month=  → 저장/수정 (교사 전용)
 */
@Slf4j
@RestController
@RequestMapping("/api/class/goal")
@RequiredArgsConstructor
public class ClassGoalController {

    private final ClassGoalService classGoalService;

    /**
     * GET /api/class/goal/{classroomId}?year=2026&month=3
     * 해당 월 학급 목표 조회
     * - 목표 없으면 204 No Content
     */
    @GetMapping("/{classroomId}")
    public ResponseEntity<?> getGoal(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "0") int month) {

        LocalDate now = LocalDate.now();
        int y = year > 0 ? year : now.getYear();
        int m = month > 0 ? month : now.getMonthValue();

        return classGoalService.getGoal(classroomId, y, m)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * POST /api/class/goal/{classroomId}?year=2026&month=3
     * 학급 목표 저장/수정 (교사만 가능)
     * - 없으면 생성, 있으면 수정
     */
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PostMapping("/{classroomId}")
    public ResponseEntity<?> saveGoal(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "0") int month,
            @RequestBody ClassGoalDTO.SaveRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        if (request.getGoal() == null || request.getGoal().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "목표 내용은 필수입니다."));
        }

        LocalDate now = LocalDate.now();
        int y = year > 0 ? year : now.getYear();
        int m = month > 0 ? month : now.getMonthValue();

        try {
            Long teacherUid = authUser.getCustomUserDTO().getUid();
            ClassGoalDTO.Response response = classGoalService.saveGoal(teacherUid, classroomId, y, m, request);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            log.warn("[soojin] 학급 목표 권한 없음 - classroomId: {}", classroomId);
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            log.warn("[soojin] 학급 목표 저장 실패 - {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
