package com.example.schoolmate.cheol.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.studentabilitydto.StudentAbilityRequestDTO;
import com.example.schoolmate.cheol.dto.studentabilitydto.StudentAbilityResponseDTO;
import com.example.schoolmate.cheol.service.StudentAbilityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/student-abilities")
@RequiredArgsConstructor
public class StudentAbilityController {

    private final StudentAbilityService studentAbilityService;

    /**
     * 세부능력 저장/수정 (현재 ACTIVE 학기 기준 upsert)
     * POST /api/student-abilities
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<StudentAbilityResponseDTO> save(
            @Valid @RequestBody StudentAbilityRequestDTO request) {
        return ResponseEntity.ok(studentAbilityService.save(request));
    }

    /**
     * 학생의 전체 세부능력 조회
     * GET /api/student-abilities/student/{studentId}
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentAbilityResponseDTO>> getByStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(studentAbilityService.getByStudentId(studentId));
    }

    /**
     * 학생 + 과목 코드 기준 현재 학기 세부능력 단건 조회 (모달 pre-fill용)
     * GET /api/student-abilities/student/{studentId}/subject?subjectCode=MATH01
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @GetMapping("/student/{studentId}/subject")
    public ResponseEntity<StudentAbilityResponseDTO> getByStudentAndSubject(
            @PathVariable Long studentId,
            @RequestParam String subjectCode) {
        return studentAbilityService.getByStudentAndSubject(studentId, subjectCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
