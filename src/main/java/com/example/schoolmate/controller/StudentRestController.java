package com.example.schoolmate.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.common.service.StudentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentRestController {

    private final StudentService studentService;

    // 학생 등록
    // POST /api/students
    @PostMapping
    public ResponseEntity<StudentResponseDTO> createStudent(
            @Validated @RequestBody StudentCreateDTO createDTO) {
        StudentResponseDTO response = studentService.createStudent(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 학생 정보 조회 (UID)
    // GET /api/students/{uid}
    @GetMapping("/{uid}")
    public ResponseEntity<StudentResponseDTO> getStudent(@PathVariable Long uid) {
        StudentResponseDTO response = studentService.getStudentByUid(uid);
        return ResponseEntity.ok(response);
    }

    // 학생 정보 조회 (학번)
    // GET /api/students/student-number/{studentNumber}
    @GetMapping("/student-number/{studentNumber}")
    public ResponseEntity<StudentResponseDTO> getStudentByStudentNumber(
            @PathVariable Integer studentNumber) {
        StudentResponseDTO response = studentService.getStudentByStudentNumber(studentNumber);
        return ResponseEntity.ok(response);
    }

    // 전체 학생 목록 조회
    // GET /api/students
    @GetMapping
    public ResponseEntity<List<StudentResponseDTO>> getAllStudents() {
        List<StudentResponseDTO> students = studentService.getAllStudents();
        return ResponseEntity.ok(students);
    }

    // 학년별 학생 목록 조회
    // GET /api/students/grade/{grade}
    @GetMapping("/grade/{grade}")
    public ResponseEntity<List<StudentResponseDTO>> getStudentsByGrade(@PathVariable int grade) {
        List<StudentResponseDTO> students = studentService.getStudentsByGrade(grade);
        return ResponseEntity.ok(students);
    }

    // 반별 학생 목록 조회
    // GET /api/students/class/{classNum}
    @GetMapping("/class/{classNum}")
    public ResponseEntity<List<StudentResponseDTO>> getStudentsByClass(@PathVariable int classNum) {
        List<StudentResponseDTO> students = studentService.getStudentsByClassNum(classNum);
        return ResponseEntity.ok(students);
    }

    // 학년 + 반별 학생 목록 조회
    // GET /api/students/search?grade={grade}&classNum={classNum}
    @GetMapping("/search")
    public ResponseEntity<List<StudentResponseDTO>> getStudentsByGradeAndClass(
            @RequestParam int grade,
            @RequestParam int classNum) {
        List<StudentResponseDTO> students = studentService.getStudentsByGradeAndClass(grade, classNum);
        return ResponseEntity.ok(students);
    }

    // 학생 정보 수정
    // PUT /api/students/{uid}
    @PutMapping("/{uid}")
    public ResponseEntity<StudentResponseDTO> updateStudent(
            @PathVariable Long uid,
            @Validated @RequestBody StudentUpdateDTO updateDTO) {
        StudentResponseDTO response = studentService.updateStudent(uid, updateDTO);
        return ResponseEntity.ok(response);
    }

    // 학생 삭제 (소프트 삭제 - status를 INACTIVE로 변경)
    // DELETE /api/students/{uid}
    @DeleteMapping("/{uid}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long uid) {
        studentService.deleteStudent(uid);
        return ResponseEntity.noContent().build();
    }

    // 학생 완전 삭제 (물리적 삭제)
    // DELETE /api/students/{uid}/permanent
    @DeleteMapping("/{uid}/permanent")
    public ResponseEntity<Void> permanentDeleteStudent(@PathVariable Long uid) {
        studentService.permanentDeleteStudent(uid);
        return ResponseEntity.noContent().build();
    }
}
