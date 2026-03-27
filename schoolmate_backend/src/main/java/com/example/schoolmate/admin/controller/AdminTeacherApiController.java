package com.example.schoolmate.admin.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.domain.term.entity.CourseSection;
import com.example.schoolmate.domain.term.service.CourseSectionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;

// 교사 관리 REST API
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_TEACHERS)
@RequiredArgsConstructor
@PreAuthorize("@grants.canManageTeachers()")
public class AdminTeacherApiController {

    private final TeacherService teacherService;
    private final CourseSectionService courseSectionService;

    @PreAuthorize("@grants.canAccessAdmin()")
    @GetMapping
    public ResponseEntity<Page<TeacherDTO.DetailResponse>> list(
            TeacherDTO.TeacherSearchCondition condition,
            @PageableDefault(size = 10, sort = "uid", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(teacherService.getTeacherList(condition, pageable));
    }

    @GetMapping("/{uid}")
    public ResponseEntity<TeacherDTO.DetailResponse> detail(@PathVariable Long uid) {
        return ResponseEntity.ok(teacherService.getTeacherDetail(uid));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TeacherDTO.CreateRequest request) {
        try {
            teacherService.createTeacher(request);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("교사 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{uid}")
    public ResponseEntity<Void> update(@PathVariable Long uid, @RequestBody TeacherDTO.UpdateRequest request) {
        request.setUid(uid);
        teacherService.updateTeacher(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-status")
    public ResponseEntity<String> bulkStatus(@RequestParam List<Long> uids, @RequestParam String status) {
        try {
            teacherService.bulkUpdateTeacherStatus(uids, status);
            return ResponseEntity.ok("상태 변경되었습니다.");
        } catch (Exception e) {
            log.error("교사 일괄 상태 변경 실패: uids={}, status={}, msg={}", uids, status, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/import-csv")
    public ResponseEntity<List<String>> importCsv(@RequestParam MultipartFile file) {
        try {
            List<String> errors = teacherService.importTeachersFromCsv(file);
            return ResponseEntity.ok(errors);
        } catch (Exception e) {
            log.error("교사 CSV 가져오기 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of("CSV 처리 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @PostMapping("/{uid}/role")
    public ResponseEntity<Void> addRole(@PathVariable Long uid, @RequestParam String role) {
        teacherService.addRole(uid, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{uid}/role")
    public ResponseEntity<Void> removeRole(@PathVariable Long uid, @RequestParam String role) {
        teacherService.removeRole(uid, role);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> departments() {
        return ResponseEntity.ok(List.of("교무부", "학생부", "연구부", "진로진학부", "환경부", "체육부"));
    }

    @GetMapping("/positions")
    public ResponseEntity<List<String>> positions() {
        return ResponseEntity.ok(List.of("교장", "교감", "수석교사", "부장교사", "평교사", "기간제교사"));
    }

    // ========== 수업 분반(CourseSection) 관리 ==========

    /** 교사의 현재 학기 수업 분반 목록 */
    @GetMapping("/{uid}/sections")
    public ResponseEntity<List<Map<String, Object>>> getSections(@PathVariable Long uid) {
        List<CourseSection> sections = courseSectionService.getSectionsForTeacherUser(uid);
        List<Map<String, Object>> result = sections.stream()
                .map(s -> toSectionMap(s))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** 교사에게 수업 분반 일괄 등록 */
    @PostMapping("/{uid}/sections")
    public ResponseEntity<List<Map<String, Object>>> createSections(
            @PathVariable Long uid,
            @RequestBody Map<String, List<Long>> body) {
        List<Long> classroomIds = body.get("classroomIds");
        if (classroomIds == null || classroomIds.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            List<CourseSection> created = courseSectionService.createSectionsForTeacher(uid, classroomIds);
            List<Map<String, Object>> result = created.stream()
                    .map(s -> toSectionMap(s))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.error("수업 분반 등록 실패: uid={}, msg={}", uid, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /** 수업 분반 삭제 */
    @DeleteMapping("/{uid}/sections/{sectionId}")
    public ResponseEntity<Void> deleteSection(
            @PathVariable Long uid,
            @PathVariable Long sectionId) {
        courseSectionService.deleteSection(sectionId);
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> toSectionMap(CourseSection s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("termId", s.getTerm().getId());
        m.put("termName", s.getTerm().getDisplayName());
        m.put("subjectName", s.getSubject().getName());
        m.put("classroomId", s.getClassroom().getCid());
        m.put("classroomName", s.getClassroom().getClassName());
        m.put("grade", s.getClassroom().getGrade());
        m.put("classNum", s.getClassroom().getClassNum());
        m.put("studentCount", courseSectionService.getStudentCount(s));
        return m;
    }
}
