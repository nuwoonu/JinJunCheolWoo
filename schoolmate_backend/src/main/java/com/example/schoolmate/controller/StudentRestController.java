package com.example.schoolmate.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.woo.dto.ClassStudentDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@Slf4j
public class StudentRestController {

    private final StudentService studentService;
    private final TeacherService teacherService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StudentInfoRepository studentInfoRepository;

    // 학생 등록
    // POST /api/students
    @PostMapping
    public ResponseEntity<StudentResponseDTO> createStudent(
            @Validated @RequestBody StudentCreateDTO createDTO) {
        StudentResponseDTO response = studentService.createStudent(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 학생 정보 조회 (User.uid 기준)
    // GET /api/students/{uid}
    @GetMapping("/{id}")
    public ResponseEntity<StudentResponseDTO> getStudent(@PathVariable Long id) {
        StudentResponseDTO response = studentService.getStudentByUserUid(id);
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
    public ResponseEntity<?> getAllStudents(
            @AuthenticationPrincipal AuthUserDTO authUser) {

        // [woo] 교사: 담임 학급 학생만 반환
        if (authUser != null && authUser.getCustomUserDTO().getRole() == UserRole.TEACHER) {
            try {
                TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(authUser.getCustomUserDTO().getUid())
                        .orElseThrow(() -> new IllegalArgumentException("교사 정보 없음"));
                int currentYear = LocalDate.now().getYear();
                ClassStudentDTO classInfo = teacherService.getMyClassStudents(teacherInfo.getId(), currentYear);
                // [woo] 프론트 Student 인터페이스에 맞게 변환
                List<StudentResponseDTO> mapped = classInfo.getStudents().stream()
                        .map(s -> StudentResponseDTO.builder()
                                .id(s.getStudentId())
                                .userName(s.getName())
                                .studentNumber(s.getStudentNumber() != null ? Long.valueOf(s.getStudentNumber()) : null)
                                .fullStudentNumber(classInfo.getGrade() + "학년 " + classInfo.getClassNum() + "반 " + (s.getStudentNumber() != null ? s.getStudentNumber() + "번" : ""))
                                .year(classInfo.getGrade())
                                .classNum(classInfo.getClassNum())
                                .phone(s.getPhone())
                                .userEmail(s.getEmail())
                                .build())
                        .toList();
                log.info("[woo] 교사 학급 학생 조회 - {}명", mapped.size());
                return ResponseEntity.ok(mapped);
            } catch (IllegalArgumentException e) {
                log.warn("[woo] 교사 담임 학급 없음 - {}", e.getMessage());
                return ResponseEntity.ok(List.of());
            }
        }

        // [woo] 학생: 본인 학급(classroom) 학생만 반환
        if (authUser != null && authUser.getCustomUserDTO().getRole() == UserRole.STUDENT) {
            Long uid = authUser.getCustomUserDTO().getUid();
            StudentInfo myInfo = studentInfoRepository.findByUserUid(uid).orElse(null);
            if (myInfo != null && myInfo.getCurrentAssignment() != null
                    && myInfo.getCurrentAssignment().getClassroom() != null) {
                Long classroomId = myInfo.getCurrentAssignment().getClassroom().getCid();
                List<StudentResponseDTO> students = studentInfoRepository.findByClassroomCid(classroomId).stream()
                        .map(StudentResponseDTO::from)
                        .toList();
                log.info("[woo] 학생 본인 학급 조회 - classroomId: {}, {}명", classroomId, students.size());
                return ResponseEntity.ok(students);
            }
            return ResponseEntity.ok(List.of());
        }

        // [woo] 그 외 (ADMIN 등): 전체 조회
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
