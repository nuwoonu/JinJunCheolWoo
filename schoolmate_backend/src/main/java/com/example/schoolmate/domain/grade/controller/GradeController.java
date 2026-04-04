package com.example.schoolmate.domain.grade.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.grade.dto.GradeDTO;
import com.example.schoolmate.domain.grade.service.GradeService;

import lombok.RequiredArgsConstructor;

// [cheol] /api/grades - React SPA에서 /api 프록시로 접근 가능하도록 경로 변경
@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    // 전체 성적 조회
    // GET /api/grades
    @GetMapping
    public ResponseEntity<List<GradeDTO>> getAllGrades() {
        List<GradeDTO> grades = gradeService.getAllGrades();
        return ResponseEntity.ok(grades);
    }

    // 학기별 성적 조회 (AcademicTerm ID 기반)
    // GET /api/grades/search?termId=1
    @GetMapping("/search")
    public ResponseEntity<List<GradeDTO>> getGradesByAcademicTerm(
            @RequestParam Long termId) {
        List<GradeDTO> grades = gradeService.getGradesByAcademicTerm(termId);
        return ResponseEntity.ok(grades);
    }

    // 과목별 성적 조회
    // GET /api/grades/subject/{subjectCode}
    @GetMapping("/subject/{subjectCode}")
    public ResponseEntity<List<GradeDTO>> getGradesBySubject(
            @PathVariable String subjectCode) {
        List<GradeDTO> grades = gradeService.getGradesBySubjectCode(subjectCode);
        return ResponseEntity.ok(grades);
    }

    // 학생별 성적 조회
    // GET /api/grades/student/{studentId}
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<GradeDTO>> getGradesByStudent(
            @PathVariable Long studentId) {
        List<GradeDTO> grades = gradeService.getGradesByStudentId(studentId);
        return ResponseEntity.ok(grades);
    }

    // GET /api/grades/student/{studentId}/search?semester=1&year=FIRST
    // 학생의 특정 학기/학년 성적 조회
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}/search")
    public ResponseEntity<List<GradeDTO>> getGradesByStudentAndAcademicTerm(
            @PathVariable Long studentId,
            @RequestParam Long termId) {
        List<GradeDTO> grades = gradeService.getGradesByStudentAndAcademicTerm(
                studentId, termId);
        return ResponseEntity.ok(grades);
    }
}
