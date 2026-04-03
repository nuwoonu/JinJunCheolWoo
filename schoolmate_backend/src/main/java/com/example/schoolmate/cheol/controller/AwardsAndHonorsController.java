package com.example.schoolmate.cheol.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.AwardsAndHonorsRequestDTO;
import com.example.schoolmate.cheol.dto.AwardsAndHonorsResponseDTO;
import com.example.schoolmate.cheol.service.AwardsAndHonorsService;

import lombok.RequiredArgsConstructor;

// [cheol] /api/awards - 수상 경력 API
@RestController
@RequestMapping("/api/awards")
@RequiredArgsConstructor
public class AwardsAndHonorsController {

    private final AwardsAndHonorsService awardsAndHonorsService;

    // 학생별 수상 경력 조회
    // GET /api/awards/student/{studentId}
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AwardsAndHonorsResponseDTO>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(awardsAndHonorsService.getByStudentId(studentId));
    }

    // 수상 경력 등록
    // POST /api/awards
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<AwardsAndHonorsResponseDTO> save(@RequestBody AwardsAndHonorsRequestDTO request) {
        return ResponseEntity.ok(awardsAndHonorsService.save(request));
    }

    // 수상 경력 삭제
    // DELETE /api/awards/{id}
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        awardsAndHonorsService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
