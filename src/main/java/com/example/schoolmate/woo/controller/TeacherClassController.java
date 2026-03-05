package com.example.schoolmate.woo.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
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
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.common.service.TeacherService;

import lombok.RequiredArgsConstructor;

/**
 * ========================================
 * 담당 학급 관리 API (교사용)
 * ========================================
 *
 * [API 목록]
 *
 * 1. 담임 배정 확인
 *    - GET  /{teacherId}/homeroom-check   → 담임 여부 확인
 *    - GET  /{teacherId}/my-classroom     → 담임 학급 정보 조회
 *
 * 2. 담당 학급 학생 조회
 *    - GET  /{teacherId}/students         → 담당 학급 학생 목록
 *    - GET  /search                       → 특정 학급 학생 조회 (학년/반)
 *
 * 3. 담당 학급 학생 관리 (담임 전용)
 *    - POST   /{teacherId}/students       → 담당 학급에 학생 등록
 *    - PUT    /{teacherId}/students/{id}  → 담당 학급 학생 수정
 *    - DELETE /{teacherId}/students/{id}  → 담당 학급 학생 삭제
 *
 * 4. 담당 학급 학생 성적 입력 (담임 전용)
 *    - POST /{teacherId}/students/grade   → 담당 학급 학생 성적 입력
 */
@RestController
@RequestMapping("/api/teacher/class")
@RequiredArgsConstructor
public class TeacherClassController {

    private final TeacherService teacherService;

    // ==================================================================================
    // ========== 1. 담임 배정 확인 ==========
    // ==================================================================================

    /**
     * ★ 담임 배정 여부 확인
     *
     * GET /api/teacher/class/{teacherId}/homeroom-check?year=2025
     *
     * [응답 예시]
     * { "isHomeroom": true, "year": 2025 }
     * { "isHomeroom": false, "year": 2025 }
     */
    @GetMapping("/{teacherId}/homeroom-check")
    public ResponseEntity<Map<String, Object>> checkHomeroom(
            @PathVariable Long teacherId,
            @RequestParam int year) {

        boolean isHomeroom = teacherService.isHomeroom(teacherId, year);

        Map<String, Object> response = new HashMap<>();
        response.put("isHomeroom", isHomeroom);
        response.put("year", year);
        response.put("teacherId", teacherId);

        return ResponseEntity.ok(response);
    }

    /**
     * ★ 담임 학급 정보 조회
     *
     * GET /api/teacher/class/{teacherId}/my-classroom?year=2025
     *
     * [응답 예시 - 담임인 경우]
     * {
     *   "hasClassroom": true,
     *   "classroomId": 5,
     *   "year": 2025,
     *   "grade": 3,
     *   "classNum": 2,
     *   "className": "2025학년도 3학년 2반"
     * }
     *
     * [응답 예시 - 담임이 아닌 경우]
     * { "hasClassroom": false, "message": "담당 학급이 없습니다." }
     */
    @GetMapping("/{teacherId}/my-classroom")
    public ResponseEntity<Map<String, Object>> getMyClassroom(
            @PathVariable Long teacherId,
            @RequestParam int year) {

        Map<String, Object> response = new HashMap<>();

        var classroomOpt = teacherService.getMyClassroom(teacherId, year);

        if (classroomOpt.isPresent()) {
            Classroom classroom = classroomOpt.get();
            response.put("hasClassroom", true);
            response.put("classroomId", classroom.getCid());
            response.put("year", classroom.getYear());
            response.put("grade", classroom.getGrade());
            response.put("classNum", classroom.getClassNum());
            response.put("className", classroom.getClassName());
        } else {
            response.put("hasClassroom", false);
            response.put("message", "담당 학급이 없습니다. 관리자에게 담임 배정을 요청하세요.");
        }

        return ResponseEntity.ok(response);
    }

    // ==================================================================================
    // ========== 2. 담당 학급 학생 조회 ==========
    // ==================================================================================

    /**
     * 내 담당 반 학생들 조회
     *
     * GET /api/teacher/class/{teacherId}/students?year=2025
     */
    @GetMapping("/{teacherId}/students")
    public ResponseEntity<ClassStudentDTO> getMyClassStudents(
            @PathVariable Long teacherId,
            @RequestParam int year) {
        ClassStudentDTO response = teacherService.getMyClassStudents(teacherId, year);
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 학급 학생들 조회 (학년/반으로 검색)
     *
     * GET /api/teacher/class/search?year=2025&grade=3&classNum=2
     */
    @GetMapping("/search")
    public ResponseEntity<ClassStudentDTO> getClassStudents(
            @RequestParam int year,
            @RequestParam int grade,
            @RequestParam int classNum) {
        ClassStudentDTO response = teacherService.getClassStudents(year, grade, classNum);
        return ResponseEntity.ok(response);
    }

    // ==================================================================================
    // ========== 3. ★ 담당 학급 학생 관리 (담임 전용) ==========
    // ==================================================================================

    /**
     * ★ 담당 학급에 학생 등록 (담임 전용)
     *
     * POST /api/teacher/class/{teacherId}/students?year=2025
     *
     * [요청 본문]
     * {
     *   "studentNumber": "20250301",
     *   "birthDate": "2010-05-15",
     *   "address": "서울시 강남구",
     *   "phone": "010-1234-5678",
     *   "gender": "M"
     * }
     *
     * ※ classroomId는 자동으로 담당 학급으로 설정됨
     */
    @PostMapping("/{teacherId}/students")
    public ResponseEntity<StudentResponseDTO> createStudentInMyClass(
            @PathVariable Long teacherId,
            @RequestParam int year,
            @RequestBody StudentCreateDTO createDTO) {

        StudentResponseDTO response = teacherService.createStudentInMyClass(teacherId, year, createDTO);
        return ResponseEntity.ok(response);
    }

    /**
     * ★ 담당 학급 학생 정보 수정 (담임 전용)
     *
     * PUT /api/teacher/class/{teacherId}/students/{studentId}?year=2025
     *
     * [요청 본문]
     * {
     *   "address": "서울시 서초구",
     *   "phone": "010-9999-8888"
     * }
     *
     * ※ classroomId 변경은 무시됨 (반 이동은 관리자 권한 필요)
     */
    @PutMapping("/{teacherId}/students/{studentId}")
    public ResponseEntity<StudentResponseDTO> updateMyClassStudent(
            @PathVariable Long teacherId,
            @PathVariable Long studentId,
            @RequestParam int year,
            @RequestBody StudentUpdateDTO updateDTO) {

        StudentResponseDTO response = teacherService.updateMyClassStudent(teacherId, year, studentId, updateDTO);
        return ResponseEntity.ok(response);
    }

    /**
     * ★ 담당 학급 학생 삭제 (담임 전용 - 소프트 삭제)
     *
     * DELETE /api/teacher/class/{teacherId}/students/{studentId}?year=2025
     */
    @DeleteMapping("/{teacherId}/students/{studentId}")
    public ResponseEntity<Map<String, Object>> deleteMyClassStudent(
            @PathVariable Long teacherId,
            @PathVariable Long studentId,
            @RequestParam int year) {

        teacherService.deleteMyClassStudent(teacherId, year, studentId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "학생이 삭제(자퇴 처리)되었습니다.");
        response.put("studentId", studentId);

        return ResponseEntity.ok(response);
    }

    // ==================================================================================
    // ========== 4. ★ 담당 학급 학생 성적 입력 (담임 전용) ==========
    // ==================================================================================

    /**
     * ★ 담당 학급 학생 성적 입력 (담임 전용)
     *
     * POST /api/teacher/class/{teacherId}/students/grade?year=2025
     *
     * [요청 본문]
     * {
     *   "studentId": 10,
     *   "subjectCode": "MATH101",
     *   "testType": "MIDTERM",
     *   "semester": 1,
     *   "year": 2025,
     *   "score": 95.0
     * }
     */
    @PostMapping("/{teacherId}/students/grade")
    public ResponseEntity<Map<String, Object>> inputGradeForMyClass(
            @PathVariable Long teacherId,
            @RequestParam int year,
            @RequestBody GradeInputDTO gradeDTO) {

        teacherService.inputGradeForMyClass(teacherId, year, gradeDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "성적이 입력되었습니다.");
        response.put("studentId", gradeDTO.getStudentId());
        response.put("subjectCode", gradeDTO.getSubjectCode());
        response.put("score", gradeDTO.getScore());

        return ResponseEntity.ok(response);
    }

    /**
     * ★ 특정 학생이 담당 학급 학생인지 확인
     *
     * GET /api/teacher/class/{teacherId}/students/{studentId}/check?year=2025
     */
    @GetMapping("/{teacherId}/students/{studentId}/check")
    public ResponseEntity<Map<String, Object>> checkMyClassStudent(
            @PathVariable Long teacherId,
            @PathVariable Long studentId,
            @RequestParam int year) {

        boolean isMyStudent = teacherService.isMyClassStudent(teacherId, year, studentId);

        Map<String, Object> response = new HashMap<>();
        response.put("isMyClassStudent", isMyStudent);
        response.put("teacherId", teacherId);
        response.put("studentId", studentId);
        response.put("year", year);

        return ResponseEntity.ok(response);
    }
}
