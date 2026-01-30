package com.example.schoolmate.woo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.woo.dto.ClassStudentDTO;

import lombok.RequiredArgsConstructor;

// 담당 학급 조회 API
@RestController
@RequestMapping("/api/teacher/class")
@RequiredArgsConstructor
public class TeacherClassController {

    private final TeacherService teacherService;

    // 내 담당 반 학생들 조회
    // GET /api/teacher/class/{teacherId}/students?year=2025
    @GetMapping("/{teacherId}/students")
    public ResponseEntity<ClassStudentDTO> getMyClassStudents(
            @PathVariable Long teacherId,
            @RequestParam int year) {
        ClassStudentDTO response = teacherService.getMyClassStudents(teacherId, year);
        return ResponseEntity.ok(response);
    }

    // 특정 학급 학생들 조회
    // GET /api/teacher/class/search?year=2025&grade=3&classNum=2
    @GetMapping("/search")
    public ResponseEntity<ClassStudentDTO> getClassStudents(
            @RequestParam int year,
            @RequestParam int grade,
            @RequestParam int classNum) {
        ClassStudentDTO response = teacherService.getClassStudents(year, grade, classNum);
        return ResponseEntity.ok(response);
    }
}
