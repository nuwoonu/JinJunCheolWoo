package com.example.schoolmate.woo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.woo.service.TeacherService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

// 교사가 학생을 관리하는 API
// cheol의 StudentResponseDTO 등 재사용
@RestController
@RequestMapping("/api/teacher/students")
@RequiredArgsConstructor
public class TeacherStudentController {

    private final TeacherService teacherService;

    // 학생 등록
    // POST /api/teacher/students
    @PostMapping
    public ResponseEntity<StudentResponseDTO> createStudent(
            @Valid @RequestBody StudentCreateDTO createDTO) {
        StudentResponseDTO response = teacherService.createStudent(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 학생 단건 조회
    // GET /api/teacher/students/{studentId}
    @GetMapping("/{studentId}")
    public ResponseEntity<StudentResponseDTO> getStudent(@PathVariable Long studentId) {
        StudentResponseDTO response = teacherService.getStudentById(studentId);
        return ResponseEntity.ok(response);
    }

    // 학생 전체 조회
    // GET /api/teacher/students
    @GetMapping
    public ResponseEntity<List<StudentResponseDTO>> getAllStudents() {
        List<StudentResponseDTO> response = teacherService.getAllStudents();
        return ResponseEntity.ok(response);
    }

    // 학생 정보 수정
    // PUT /api/teacher/students/{studentId}
    @PutMapping("/{studentId}")
    public ResponseEntity<StudentResponseDTO> updateStudent(
            @PathVariable Long studentId,
            @RequestBody StudentUpdateDTO updateDTO) {
        StudentResponseDTO response = teacherService.updateStudent(studentId, updateDTO);
        return ResponseEntity.ok(response);
    }

    // 학생 삭제 (자퇴 처리)
    // DELETE /api/teacher/students/{studentId}
    @DeleteMapping("/{studentId}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long studentId) {
        teacherService.deleteStudent(studentId);
        return ResponseEntity.noContent().build();
    }
}
