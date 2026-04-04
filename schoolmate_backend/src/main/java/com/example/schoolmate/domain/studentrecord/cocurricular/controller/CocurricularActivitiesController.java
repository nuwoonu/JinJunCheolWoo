package com.example.schoolmate.domain.studentrecord.cocurricular.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.studentrecord.cocurricular.dto.CocurricularActivitiesDTO;
import com.example.schoolmate.domain.studentrecord.cocurricular.dto.CocurricularActivitiesRequestDTO;
import com.example.schoolmate.domain.studentrecord.cocurricular.service.CocurricularActivitiesService;

import lombok.RequiredArgsConstructor;

// [cheol] /api/cocurricular-activities - 창의적 체험활동 API
@RestController
@RequestMapping("/api/cocurricular-activities")
@RequiredArgsConstructor
public class CocurricularActivitiesController {

    private final CocurricularActivitiesService cocurricularActivitiesService;

    // 학생별 전체 조회
    // GET /api/cocurricular-activities/student/{studentId}
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<CocurricularActivitiesDTO>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(cocurricularActivitiesService.getByStudentId(studentId));
    }

    // 등록/수정 (학년+카테고리 기준 upsert)
    // PUT /api/cocurricular-activities/student/{studentId}
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @PutMapping("/student/{studentId}")
    public ResponseEntity<CocurricularActivitiesDTO> save(
            @PathVariable Long studentId,
            @RequestBody CocurricularActivitiesRequestDTO request) {
        return ResponseEntity.ok(cocurricularActivitiesService.save(studentId, request));
    }
}
