package com.example.schoolmate.woo.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.constant.TestType;
import com.example.schoolmate.common.repository.info.FamilyRelationRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.GradeResponseDTO;
import com.example.schoolmate.woo.service.GradeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [woo] 성적 API 컨트롤러
 *
 * [교사]
 * GET  /api/grades/my-sections           → 내 분반 목록
 * GET  /api/grades/section/{id}/students → 분반 학생 목록 (성적 포함)
 * POST /api/grades                       → 성적 입력
 * PUT  /api/grades/{gradeId}             → 성적 수정
 *
 * [담임교사]
 * GET  /api/grades/classroom/{id}        → 학급 전체 성적 조회
 *
 * [학생]
 * GET  /api/grades/my                    → 본인 성적 조회
 *
 * [학부모]
 * GET  /api/grades/child/{studentInfoId} → 자녀 성적 조회
 *
 * [공통]
 * GET  /api/grades/terms                 → 학기 목록 조회
 */
@Slf4j
@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeApiController {

    private final GradeService gradeService;
    private final FamilyRelationRepository familyRelationRepository;

    // ========== [woo] 교사: 내 분반 목록 ==========

    @GetMapping("/my-sections")
    public ResponseEntity<List<GradeService.CourseSectionDTO>> getMyCourseSections(
            @RequestParam(required = false) Long termId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        return ResponseEntity.ok(gradeService.getMyCourseSections(uid, termId));
    }

    // ========== [woo] 교사: 분반 성적 요약 대시보드 ==========

    @GetMapping("/section/{sectionId}/summary")
    public ResponseEntity<?> getSectionSummary(
            @PathVariable Long sectionId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            return ResponseEntity.ok(gradeService.getSectionSummary(sectionId, uid));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 교사: 분반 학생 목록 (성적 포함) ==========

    @GetMapping("/section/{sectionId}/students")
    public ResponseEntity<List<GradeResponseDTO>> getSectionStudents(
            @PathVariable Long sectionId,
            @RequestParam TestType testType,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        return ResponseEntity.ok(gradeService.getSectionStudents(sectionId, testType, uid));
    }

    // ========== [woo] 교사: 성적 입력 ==========

    @PostMapping
    public ResponseEntity<?> inputGrade(
            @RequestBody GradeInputDTO dto,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            GradeResponseDTO response = gradeService.inputGrade(dto, uid);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 교사: 성적 일괄 입력 ==========

    @PostMapping("/batch")
    public ResponseEntity<?> inputGradeBatch(
            @RequestBody List<GradeInputDTO> dtos,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            List<GradeResponseDTO> results = dtos.stream()
                    .map(dto -> gradeService.inputGrade(dto, uid))
                    .toList();
            return ResponseEntity.ok(results);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 교사: 성적 수정 ==========

    @PutMapping("/{gradeId}")
    public ResponseEntity<?> updateGrade(
            @PathVariable Long gradeId,
            @RequestBody Map<String, Double> body,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            Double score = body.get("score");
            GradeResponseDTO response = gradeService.updateGrade(gradeId, score, uid);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 담임교사: 학급 전체 성적 조회 ==========

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<?> getClassroomGrades(
            @PathVariable Long classroomId,
            @RequestParam(required = false) Long termId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            return ResponseEntity.ok(gradeService.getClassroomGrades(classroomId, termId, uid));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 학생: 본인 학급 평균 비교 ==========

    @GetMapping("/my/class-info")
    public ResponseEntity<?> getMyClassInfo(
            @RequestParam(required = false) Long termId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            return ResponseEntity.ok(gradeService.getMyClassInfo(uid, termId));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 학생: 본인 성적 조회 ==========

    @GetMapping("/my")
    public ResponseEntity<List<GradeResponseDTO>> getMyGrades(
            @RequestParam(required = false) Long termId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        return ResponseEntity.ok(gradeService.getMyGrades(uid, termId));
    }

    // ========== [woo] 학부모: 자녀 목록 조회 ==========

    @GetMapping("/my-children")
    public ResponseEntity<List<Map<String, Object>>> getMyChildren(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(uid);
        List<Map<String, Object>> result = relations.stream().map(r -> {
            StudentAssignment assignment = r.getStudentInfo().getCurrentAssignment();
            return Map.<String, Object>of(
                "studentInfoId", r.getStudentInfo().getId(),
                "name", r.getStudentInfo().getUser().getName(),
                "grade", assignment != null && assignment.getClassroom() != null
                    ? assignment.getClassroom().getGrade() : 0,
                "classNum", assignment != null && assignment.getClassroom() != null
                    ? assignment.getClassroom().getClassNum() : 0
            );
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ========== [woo] 학부모: 자녀 담임교사 + 학급 비교 ==========

    @GetMapping("/child/{studentInfoId}/class-info")
    public ResponseEntity<?> getChildClassInfo(
            @PathVariable Long studentInfoId,
            @RequestParam(required = false) Long termId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            return ResponseEntity.ok(gradeService.getChildClassInfo(uid, studentInfoId, termId));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 학부모: 자녀 성적 조회 ==========

    @GetMapping("/child/{studentInfoId}")
    public ResponseEntity<?> getChildGrades(
            @PathVariable Long studentInfoId,
            @RequestParam(required = false) Long termId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            return ResponseEntity.ok(gradeService.getChildGrades(uid, studentInfoId, termId));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 담임교사: 학급 과목별 비율 전체 조회 ==========

    @GetMapping("/classroom/{classroomId}/ratios")
    public ResponseEntity<?> getClassroomRatios(
            @PathVariable Long classroomId,
            @RequestParam(required = false) Long termId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            return ResponseEntity.ok(gradeService.getClassroomRatios(classroomId, termId, uid));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 분반 비율 설정 조회 ==========

    @GetMapping("/section/{sectionId}/ratio")
    public ResponseEntity<?> getSectionRatio(
            @PathVariable Long sectionId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            return ResponseEntity.ok(gradeService.getSectionRatio(sectionId, uid));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 분반 비율 설정 저장 ==========

    @PutMapping("/section/{sectionId}/ratio")
    public ResponseEntity<?> setSectionRatio(
            @PathVariable Long sectionId,
            @RequestBody GradeService.SectionRatioDTO dto,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            return ResponseEntity.ok(gradeService.setSectionRatio(sectionId, dto, uid));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 학기 목록 조회 ==========

    // [woo] 인증된 사용자의 학교 기준으로 학기 목록 반환
    @GetMapping("/terms")
    public ResponseEntity<List<GradeService.TermDTO>> getTerms(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        Long schoolId = gradeService.getSchoolIdByUid(uid);
        return ResponseEntity.ok(gradeService.getTermHistory(schoolId));
    }
}
