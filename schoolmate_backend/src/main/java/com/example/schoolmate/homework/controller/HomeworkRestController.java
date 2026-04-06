package com.example.schoolmate.homework.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.homework.dto.HomeworkDTO;
import com.example.schoolmate.homework.entity.HomeworkStatus;
import com.example.schoolmate.homework.service.HomeworkService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [woo] 과제 REST API 컨트롤러
 * - 교사: 과제 출제/수정/삭제/채점
 * - 학생: 과제 조회/제출
 * - 학부모: 자녀 과제 현황 조회
 */
@Slf4j
@RestController
@RequestMapping("/api/homework")
@RequiredArgsConstructor
public class HomeworkRestController {

    private final HomeworkService homeworkService;
    private final ClassroomRepository classroomRepository;

    // ========== [woo] 과제 출제 (교사) ==========

    /**
     * POST /api/homework
     * multipart/form-data: title, content, classroomId, dueDate + file(선택)
     */
    @PostMapping
    public ResponseEntity<?> createHomework(
            @RequestPart("data") HomeworkDTO.CreateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            HomeworkDTO.DetailResponse response = homeworkService.createHomework(
                    request, file, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            log.warn("[woo] 과제 출제 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("[woo] 과제 출제 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 과제 목록 조회 ==========

    /**
     * GET /api/homework/teacher - 교사: 내가 출제한 과제 목록
     */
    @GetMapping("/teacher")
    public ResponseEntity<Map<String, Object>> getTeacherHomeworks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Page<HomeworkDTO.ListResponse> result = homeworkService.getMyHomeworks(
                authUser.getCustomUserDTO(),
                PageRequest.of(page, size, Sort.by("createDate").descending()));

        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    /**
     * GET /api/homework/student - 학생: 내 학급 과제 목록
     */
    @GetMapping("/student")
    public ResponseEntity<Map<String, Object>> getStudentHomeworks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Page<HomeworkDTO.ListResponse> result = homeworkService.getClassroomHomeworks(
                authUser.getCustomUserDTO(),
                PageRequest.of(page, size, Sort.by("createDate").descending()));

        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    /**
     * GET /api/homework/parent/{studentInfoId} - 학부모: 자녀 과제 현황
     */
    @GetMapping("/parent/{studentInfoId}")
    public ResponseEntity<?> getChildHomeworks(
            @PathVariable Long studentInfoId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            List<HomeworkDTO.ListResponse> result = homeworkService.getChildHomeworks(
                    authUser.getCustomUserDTO(), studentInfoId);
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // ========== [woo] 과제 상세 조회 ==========

    /**
     * GET /api/homework/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getHomework(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            HomeworkDTO.DetailResponse response = homeworkService.getHomework(
                    id, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 과제 수정 (교사) ==========

    /**
     * PUT /api/homework/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateHomework(
            @PathVariable Long id,
            @RequestPart("data") HomeworkDTO.CreateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            HomeworkDTO.DetailResponse response = homeworkService.updateHomework(
                    id, request, file, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 과제 삭제 (교사) ==========

    /**
     * DELETE /api/homework/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHomework(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            homeworkService.deleteHomework(id, authUser.getCustomUserDTO());
            return ResponseEntity.ok().body("삭제되었습니다.");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 과제 제출 (학생) ==========

    /**
     * POST /api/homework/{id}/submit
     * multipart/form-data: content + file(선택)
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitHomework(
            @PathVariable Long id,
            @RequestPart(value = "data", required = false) HomeworkDTO.SubmitRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            if (request == null) {
                request = new HomeworkDTO.SubmitRequest();
            }
            HomeworkDTO.SubmissionResponse response = homeworkService.submitHomework(
                    id, request, file, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 제출 수정 (학생) ==========

    /**
     * PUT /api/homework/submission/{submissionId}
     * 학생이 본인 제출물 수정 (마감 전·미채점 한정)
     */
    @PutMapping("/submission/{submissionId}")
    public ResponseEntity<?> updateSubmission(
            @PathVariable Long submissionId,
            @RequestPart(value = "data", required = false) HomeworkDTO.SubmitRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            if (request == null) request = new HomeworkDTO.SubmitRequest();
            HomeworkDTO.SubmissionResponse response = homeworkService.updateSubmission(
                    submissionId, request, file, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 채점 (교사) ==========

    /**
     * POST /api/homework/submission/{submissionId}/grade
     */
    @PostMapping("/submission/{submissionId}/grade")
    public ResponseEntity<?> gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody HomeworkDTO.GradeRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            HomeworkDTO.SubmissionResponse response = homeworkService.gradeSubmission(
                    submissionId, request, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 과제 상태 변경 (교사) ==========

    /**
     * POST /api/homework/{id}/status?status=CLOSED
     */
    @PostMapping("/{id}/status")
    public ResponseEntity<?> changeStatus(
            @PathVariable Long id,
            @RequestParam HomeworkStatus status,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            homeworkService.changeHomeworkStatus(id, status, authUser.getCustomUserDTO());
            return ResponseEntity.ok().body("상태가 변경되었습니다.");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 교사용 학급 목록 (과제 출제 시 학급 선택) ==========

    /**
     * GET /api/homework/classrooms?year=2026
     * 교사의 담임 학급 + 해당 학년도 전체 학급 목록 반환
     */
    @GetMapping("/classrooms")
    public ResponseEntity<?> getClassrooms(
            @RequestParam(required = false) Integer year) {
        int targetYear = (year != null) ? year : java.time.LocalDate.now().getYear();
        List<Classroom> classrooms = classroomRepository.findAll().stream()
                .filter(c -> c.getYear() == targetYear)
                .sorted((a, b) -> {
                    int g = Integer.compare(a.getGrade(), b.getGrade());
                    return g != 0 ? g : Integer.compare(a.getClassNum(), b.getClassNum());
                })
                .toList();

        List<Map<String, Object>> result = classrooms.stream()
                .map(c -> Map.<String, Object>of(
                        "id", c.getCid(),
                        "name", c.getClassName(),
                        "grade", c.getGrade(),
                        "classNum", c.getClassNum()))
                .toList();

        return ResponseEntity.ok(result);
    }

    // ========== [woo] 교사용 수업 분반 목록 (과제 출제 시 과목+학급 선택) ==========

    /**
     * GET /api/homework/course-sections
     * 교사 본인이 담당하는 수업 분반 목록 반환 (과목 + 학급)
     */
    @GetMapping("/course-sections")
    public ResponseEntity<?> getCourseSections(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        return ResponseEntity.ok(homeworkService.getTeacherCourseSections(authUser.getCustomUserDTO()));
    }
}
