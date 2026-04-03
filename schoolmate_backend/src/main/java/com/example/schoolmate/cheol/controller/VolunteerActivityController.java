package com.example.schoolmate.cheol.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.volunteerActivitydto.VolunteerActivityRequestDTO;
import com.example.schoolmate.cheol.dto.volunteerActivitydto.VolunteerActivityResponseDTO;
import com.example.schoolmate.cheol.service.VolunteerActivityService;
import com.example.schoolmate.common.entity.user.constant.Year;

import lombok.RequiredArgsConstructor;

// [cheol] /api/volunteer-activities - 봉사활동 API
// cumulativeHours(누계시간)는 startDate 기준으로 자동 계산됨
@RestController
@RequestMapping("/api/volunteer-activities")
@RequiredArgsConstructor
public class VolunteerActivityController {

    private final VolunteerActivityService volunteerActivityService;

    // 학생별 전체 봉사활동 조회
    // GET /api/volunteer-activities/student/{studentId}
    @PreAuthorize("hasRole('ADMIN') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<VolunteerActivityResponseDTO>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(volunteerActivityService.getByStudentId(studentId));
    }

    // 학생별 특정 학년 봉사활동 조회
    // GET /api/volunteer-activities/student/{studentId}/year/{year}
    @PreAuthorize("hasRole('ADMIN') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}/year/{year}")
    public ResponseEntity<List<VolunteerActivityResponseDTO>> getByStudentAndYear(
            @PathVariable Long studentId,
            @PathVariable Year year) {
        return ResponseEntity.ok(volunteerActivityService.getByStudentIdAndYear(studentId, year));
    }

    // 봉사활동 등록 (cumulativeHours 자동 계산)
    // POST /api/volunteer-activities
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<VolunteerActivityResponseDTO> save(
            @RequestBody VolunteerActivityRequestDTO request) {
        return ResponseEntity.ok(volunteerActivityService.save(request));
    }

    // 봉사활동 수정 (cumulativeHours 자동 재계산)
    // PUT /api/volunteer-activities/{id}
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @PutMapping("/{id}")
    public ResponseEntity<VolunteerActivityResponseDTO> update(
            @PathVariable Long id,
            @RequestBody VolunteerActivityRequestDTO request) {
        return ResponseEntity.ok(volunteerActivityService.update(id, request));
    }

    // 봉사활동 삭제 (삭제 후 누계 재계산)
    // DELETE /api/volunteer-activities/{id}
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        volunteerActivityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
