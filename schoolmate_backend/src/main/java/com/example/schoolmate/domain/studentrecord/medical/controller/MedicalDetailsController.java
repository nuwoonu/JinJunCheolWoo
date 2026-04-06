package com.example.schoolmate.domain.studentrecord.medical.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.studentrecord.medical.dto.MedicalDetailsRequestDTO;
import com.example.schoolmate.domain.studentrecord.medical.service.MedicalDetailsService;

import lombok.RequiredArgsConstructor;

// POST /api/medical-details/student/{studentInfoId}
@RestController
@RequestMapping("/api/medical-details")
@RequiredArgsConstructor
public class MedicalDetailsController {

    private final MedicalDetailsService medicalDetailsService;

    /**
     * 학생 건강 정보 등록/수정
     * 선생님(ADMIN 포함)만 접근 가능
     * POST /api/medical-details/student/{studentInfoId}
     */
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @PostMapping("/student/{studentInfoId}")
    public ResponseEntity<Void> saveMedicalDetails(
            @PathVariable Long studentInfoId,
            @RequestBody MedicalDetailsRequestDTO dto) {
        medicalDetailsService.saveMedicalDetails(studentInfoId, dto);
        return ResponseEntity.ok().build();
    }
}
