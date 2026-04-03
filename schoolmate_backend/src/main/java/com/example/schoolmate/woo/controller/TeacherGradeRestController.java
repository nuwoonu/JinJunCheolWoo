package com.example.schoolmate.woo.controller;

import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.woo.dto.*;
import com.example.schoolmate.woo.service.FinalGradeService;
import com.example.schoolmate.woo.service.GradeRatioService;
import com.example.schoolmate.woo.service.TeacherGradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// [woo] 교사 성적 관리 REST API
@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@RequiredArgsConstructor
@Log4j2
public class TeacherGradeRestController {

    private final TeacherGradeService teacherGradeService;
    private final GradeRatioService gradeRatioService;
    private final FinalGradeService finalGradeService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final SubjectRepository subjectRepository;

    // [woo] 교사가 접근 가능한 학급 목록
    @GetMapping("/grade/my-classrooms")
    public ResponseEntity<List<ClassStudentDTO>> getMyClassrooms(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long teacherInfoId = getTeacherInfoId(authUser);
        return ResponseEntity.ok(teacherGradeService.getAccessibleClassrooms(teacherInfoId));
    }

    // [woo] 학급+과목 성적 목록
    @GetMapping("/grade/classroom/{classroomId}/subject/{subjectId}")
    public ResponseEntity<List<GradeResponseDTO>> getClassGrades(
            @PathVariable Long classroomId,
            @PathVariable Long subjectId,
            @RequestParam Long termId) {
        return ResponseEntity.ok(
                teacherGradeService.getGradesByClassroomAndSubject(classroomId, subjectId, termId));
    }

    // [woo] 성적 입력 (upsert)
    @PostMapping("/grade")
    public ResponseEntity<GradeResponseDTO> inputGrade(
            @Valid @RequestBody GradeInputDTO dto,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long teacherInfoId = getTeacherInfoId(authUser);
        return ResponseEntity.ok(teacherGradeService.inputGrade(dto, teacherInfoId));
    }

    // [woo] 성적 수정
    @PutMapping("/grade/{gradeId}")
    public ResponseEntity<GradeResponseDTO> updateGrade(
            @PathVariable Long gradeId,
            @RequestBody Map<String, Double> body,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long teacherInfoId = getTeacherInfoId(authUser);
        Double score = body.get("score");
        if (score == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(teacherGradeService.updateGrade(gradeId, score, teacherInfoId));
    }

    // [woo] 성적 삭제
    @DeleteMapping("/grade/{gradeId}")
    public ResponseEntity<Void> deleteGrade(
            @PathVariable Long gradeId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long teacherInfoId = getTeacherInfoId(authUser);
        teacherGradeService.deleteGrade(gradeId, teacherInfoId);
        return ResponseEntity.noContent().build();
    }

    // [woo] 비율 설정
    @PostMapping("/grade/ratio")
    public ResponseEntity<GradeRatioResponseDTO> setGradeRatio(
            @Valid @RequestBody GradeRatioRequestDTO dto,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long teacherInfoId = getTeacherInfoId(authUser);
        return ResponseEntity.ok(gradeRatioService.setRatio(dto, teacherInfoId));
    }

    // [woo] 비율 조회
    @GetMapping("/grade/ratio/{classroomId}/{subjectId}")
    public ResponseEntity<?> getGradeRatio(
            @PathVariable Long classroomId,
            @PathVariable Long subjectId,
            @RequestParam Semester semester,
            @RequestParam int schoolYear) {
        GradeRatioResponseDTO result = gradeRatioService.getRatio(classroomId, subjectId, semester, schoolYear);
        if (result == null) {
            return ResponseEntity.ok(Map.of("exists", false));
        }
        return ResponseEntity.ok(result);
    }

    // [woo] FinalGrade 계산 트리거
    @PostMapping("/final-grade/calculate")
    public ResponseEntity<List<FinalGradeResponseDTO>> calculateFinalGrades(
            @RequestBody Map<String, Object> body) {
        Long classroomId = Long.valueOf(body.get("classroomId").toString());
        Long subjectId = Long.valueOf(body.get("subjectId").toString());
        Semester semester = Semester.valueOf(body.get("semester").toString());
        int schoolYear = Integer.parseInt(body.get("schoolYear").toString());
        return ResponseEntity.ok(finalGradeService.calculateFinalGrades(classroomId, subjectId, semester, schoolYear));
    }

    // [woo] 학급 최종 성적 목록
    @GetMapping("/final-grade/classroom/{classroomId}/subject/{subjectId}")
    public ResponseEntity<List<FinalGradeResponseDTO>> getClassFinalGrades(
            @PathVariable Long classroomId,
            @PathVariable Long subjectId,
            @RequestParam Semester semester,
            @RequestParam int schoolYear) {
        return ResponseEntity.ok(
                finalGradeService.getClassFinalGrades(classroomId, subjectId, semester, schoolYear));
    }

    // [woo] 학교 과목 목록 조회 (성적 입력 시 과목 선택용)
    @GetMapping("/grade/subjects")
    public ResponseEntity<List<Map<String, Object>>> getSubjects() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        List<Subject> subjects = subjectRepository.findAllBySchool_Id(schoolId);
        List<Map<String, Object>> result = subjects.stream()
                .map(s -> Map.<String, Object>of(
                        "id", s.getId(),
                        "code", s.getCode(),
                        "name", s.getName()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }

    private Long getTeacherInfoId(AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        return teacherInfo.getId();
    }
}
