package com.example.schoolmate.admin.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.domain.term.service.AcademicTermService;
import com.example.schoolmate.common.service.ClassroomService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;

// 학급 관리 REST API
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_CLASSES)
@RequiredArgsConstructor
@PreAuthorize("@grants.canManageClasses()")
public class AdminClassApiController {

    private final ClassroomService classService;
    private final AcademicTermService academicTermService;

    @PreAuthorize("@grants.canAccessAdmin()")
    @GetMapping
    public ResponseEntity<Page<ClassDTO.DetailResponse>> list(
            ClassDTO.SearchCondition condition,
            @PageableDefault(size = 20, sort = "cid", direction = Sort.Direction.DESC) Pageable pageable) {
        if (condition == null)
            condition = new ClassDTO.SearchCondition();
        if (condition.getYear() == null)
            condition.setYear(academicTermService.getCurrentSchoolYear());
        return ResponseEntity.ok(classService.getClassList(condition, pageable));
    }

    @GetMapping("/{cid}")
    public ResponseEntity<ClassDTO.DetailResponse> detail(@PathVariable Long cid) {
        return ResponseEntity.ok(classService.getClassDetail(cid));
    }

    @PostMapping
    public ResponseEntity<Long> create(@RequestBody ClassDTO.CreateRequest request) {
        try {
            Long cid = classService.createClass(request);
            return ResponseEntity.ok(cid);
        } catch (Exception e) {
            log.error("학급 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{cid}")
    public ResponseEntity<Void> update(@PathVariable Long cid, @RequestBody ClassDTO.UpdateRequest request) {
        request.setCid(cid);
        classService.updateClass(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{cid}")
    public ResponseEntity<String> delete(@PathVariable Long cid) {
        try {
            classService.deleteClass(cid);
            return ResponseEntity.ok("삭제되었습니다.");
        } catch (Exception e) {
            log.error("학급 삭제 실패: cid={}, msg={}", cid, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/{cid}/students")
    public ResponseEntity<String> addStudents(@PathVariable Long cid,
            @RequestParam(required = false) List<Long> studentUids,
            @RequestParam(defaultValue = "0") int randomCount) {
        String result = classService.assignStudents(cid, studentUids, randomCount);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{cid}/students/{studentUid}")
    public ResponseEntity<String> removeStudent(@PathVariable Long cid, @PathVariable Long studentUid) {
        classService.removeStudent(cid, studentUid);
        return ResponseEntity.ok("해제되었습니다.");
    }

    @PostMapping("/{cid}/students/remove-bulk")
    public ResponseEntity<String> removeStudents(@PathVariable Long cid, @RequestParam List<Long> studentUids) {
        classService.removeStudents(cid, studentUids);
        return ResponseEntity.ok("해제되었습니다.");
    }

    @PostMapping("/{cid}/students/{studentUid}/transfer")
    public ResponseEntity<String> transferStudent(@PathVariable Long cid, @PathVariable Long studentUid,
            @RequestParam Long targetCid) {
        classService.transferStudent(cid, targetCid, studentUid);
        return ResponseEntity.ok("이동되었습니다.");
    }

    @PostMapping("/bulk-status")
    public ResponseEntity<String> bulkStatus(@RequestParam List<Long> cids, @RequestParam String status) {
        try {
            classService.bulkUpdateClassStatus(cids, status);
            return ResponseEntity.ok("상태 변경되었습니다.");
        } catch (Exception e) {
            log.error("학급 일괄 상태 변경 실패: cids={}, status={}, msg={}", cids, status, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/import-csv")
    public ResponseEntity<String> importCsv(@RequestParam MultipartFile file) {
        try {
            String result = classService.importClassesFromCsv(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("학급 CSV 가져오기 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/{cid}/roster-csv")
    public ResponseEntity<byte[]> rosterCsv(@PathVariable Long cid) {
        String csv = classService.generateRosterCsv(cid);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"class_" + cid + "_roster.csv\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(bytes);
    }

    // 담임 미배정 교사 목록 (생성용)
    @GetMapping("/teachers/unassigned")
    public ResponseEntity<List<ClassDTO.TeacherSelectResponse>> unassignedTeachers(
            @RequestParam(required = false) Integer year) {
        int y = (year != null) ? year : academicTermService.getCurrentSchoolYear();
        return ResponseEntity.ok(classService.getUnassignedTeachers(y));
    }

    // 반 배정용 미배정 학생 검색
    @GetMapping("/students/unassigned")
    public ResponseEntity<List<ClassDTO.StudentSummary>> unassignedStudents(
            @RequestParam int year,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(classService.getUnassignedStudents(year, keyword));
    }

    // 담임 배정 가능 교사 목록 (수정용)
    @GetMapping("/{cid}/teachers/available")
    public ResponseEntity<List<ClassDTO.TeacherSelectResponse>> availableTeachers(
            @PathVariable Long cid, @RequestParam int year) {
        return ResponseEntity.ok(classService.getAvailableTeachers(year, cid));
    }

    @GetMapping("/current-year")
    public ResponseEntity<Integer> currentYear() {
        return ResponseEntity.ok(academicTermService.getCurrentSchoolYear());
    }
}
