package com.example.schoolmate.cheol.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.BehaviorRecordDTO;
import com.example.schoolmate.cheol.dto.BehaviorRecordRequestDTO;
import com.example.schoolmate.cheol.service.BehaviorRecordService;

import lombok.RequiredArgsConstructor;

// [cheol] /api/behavior-records - 행동 특성 및 종합의견 API
@RestController
@RequestMapping("/api/behavior-records")
@RequiredArgsConstructor
public class BehaviorRecordController {

    private final BehaviorRecordService behaviorRecordService;

    // 학생별 전체 조회
    // GET /api/behavior-records/student/{studentId}
    @PreAuthorize("hasRole('ADMIN') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<BehaviorRecordDTO>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(behaviorRecordService.getByStudentId(studentId));
    }

    // 등록/수정 (학년+학기 기준 upsert)
    // PUT /api/behavior-records/student/{studentId}
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/student/{studentId}")
    public ResponseEntity<BehaviorRecordDTO> save(
            @PathVariable Long studentId,
            @RequestBody BehaviorRecordRequestDTO request) {
        return ResponseEntity.ok(behaviorRecordService.save(studentId, request));
    }
}
