package com.example.schoolmate.cheol.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.GradeDTO;
import com.example.schoolmate.cheol.service.GradeService;
import com.example.schoolmate.common.entity.user.constant.Year;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/grades")
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

    // 학기/학년별 성적 조회
    // GET /api/grades/search?semester=1&year=FIRST
    @GetMapping("/search")
    public ResponseEntity<List<GradeDTO>> getGradesBySemesterAndYear(
            @RequestParam int semester,
            @RequestParam Year year) {
        List<GradeDTO> grades = gradeService.getGradesBySemesterAndYear(semester, year);
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
    @PreAuthorize("hasRole('ADMIN') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<GradeDTO>> getGradesByStudent(
            @PathVariable Long studentId) {
        List<GradeDTO> grades = gradeService.getGradesByStudentId(studentId);
        return ResponseEntity.ok(grades);
    }

    // GET /api/grades/student/{studentId}/search?semester=1&year=FIRST
    // 학생의 특정 학기/학년 성적 조회
    @PreAuthorize("hasRole('ADMIN') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/student/{studentId}/search")
    public ResponseEntity<List<GradeDTO>> getGradesByStudentAndSemesterAndYear(
            @PathVariable Long studentId,
            @RequestParam int semester,
            @RequestParam Year year) {
        List<GradeDTO> grades = gradeService.getGradesByStudentAndSemesterAndYear(
                studentId, semester, year);
        return ResponseEntity.ok(grades);
    }
}