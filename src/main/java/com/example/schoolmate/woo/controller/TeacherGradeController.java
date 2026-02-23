package com.example.schoolmate.woo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.GradeDTO;
import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.woo.dto.GradeInputDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

// 교사가 성적 입력/수정하는 API
// cheol의 GradeController는 조회만, 여기서는 입력/수정 담당
@RestController
@RequestMapping("/api/teacher/grades")
@RequiredArgsConstructor
public class TeacherGradeController {

    private final TeacherService teacherService;

    // 성적 입력
    // POST /api/teacher/grades?teacherId=1
    @PostMapping
    public ResponseEntity<String> inputGrade(
            @RequestParam Long teacherId,
            @Valid @RequestBody GradeInputDTO gradeDTO) {
        teacherService.inputGrade(teacherId, gradeDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body("성적이 입력되었습니다.");
    }

    // 성적 수정
    // PUT /api/teacher/grades/{gradeId}?teacherId=1&score=95.0
    @PutMapping("/{gradeId}")
    public ResponseEntity<String> updateGrade(
            @PathVariable Long gradeId,
            @RequestParam Long teacherId,
            @RequestParam Double score) {
        teacherService.updateGrade(teacherId, gradeId, score);
        return ResponseEntity.ok("성적이 수정되었습니다.");
    }

    // 과목별 성적 조회 (교사용)
    // GET /api/teacher/grades/subject/{subjectCode}?teacherId=1
    @GetMapping("/subject/{subjectCode}")
    public ResponseEntity<List<GradeDTO>> getSubjectGrades(
            @PathVariable String subjectCode,
            @RequestParam Long teacherId) {
        List<GradeDTO> grades = teacherService.getMySubjectGrades(teacherId, subjectCode);
        return ResponseEntity.ok(grades);
    }

    // 학생별 성적 조회 (교사용)
    // GET /api/teacher/grades/student/{studentId}
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<GradeDTO>> getStudentGrades(@PathVariable Long studentId) {
        List<GradeDTO> grades = teacherService.getStudentGrades(studentId);
        return ResponseEntity.ok(grades);
    }
}
