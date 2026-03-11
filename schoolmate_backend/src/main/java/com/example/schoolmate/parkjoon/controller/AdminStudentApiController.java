package com.example.schoolmate.parkjoon.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
import com.example.schoolmate.common.service.ParentService;
import com.example.schoolmate.common.service.StudentService;
import com.example.schoolmate.common.service.SystemSettingService;

import lombok.RequiredArgsConstructor;

// 학생 관리 REST API
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_STUDENTS)
@RequiredArgsConstructor
public class AdminStudentApiController {

    private final StudentService studentService;
    private final ParentService parentService;
    private final SystemSettingService systemSettingService;

    // 목록 조회
    @GetMapping
    public ResponseEntity<Page<StudentDTO.SummaryResponse>> list(
            StudentDTO.StudentSearchCondition condition,
            @PageableDefault(size = 10) Pageable pageable) {
        if (condition == null)
            condition = new StudentDTO.StudentSearchCondition();
        return ResponseEntity.ok(studentService.getStudentSummaryList(condition, pageable));
    }

    // 상세 조회
    @GetMapping("/{uid}")
    public ResponseEntity<StudentDTO.DetailResponse> detail(@PathVariable Long uid) {
        try {
            return ResponseEntity.ok(studentService.getStudentDetail(uid));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 등록
    @PostMapping
    public ResponseEntity<Long> create(@RequestBody StudentDTO.CreateRequest request) {
        try {
            Long uid = studentService.createStudent(request);
            return ResponseEntity.ok(uid);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // 기본 정보 수정
    @PutMapping("/{uid}/basic")
    public ResponseEntity<Void> updateBasic(@PathVariable Long uid, @RequestBody StudentDTO.UpdateRequest request) {
        request.setUid(uid);
        studentService.updateStudentBasicInfo(request);
        return ResponseEntity.ok().build();
    }

    // 일괄 상태 변경
    @PostMapping("/bulk-status")
    public ResponseEntity<String> bulkStatus(@RequestParam List<Long> uids, @RequestParam String status) {
        try {
            studentService.bulkUpdateStudentStatus(uids, status);
            return ResponseEntity.ok("상태가 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // CSV 업로드
    @PostMapping("/import-csv")
    public ResponseEntity<String> importCsv(@RequestParam MultipartFile file) {
        try {
            studentService.importStudentsFromCsv(file);
            return ResponseEntity.ok("등록되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 학급 목록 (등록/수정 폼용)
    @GetMapping("/classrooms")
    public ResponseEntity<List<ClassDTO.DetailResponse>> classrooms(@RequestParam(required = false) Integer year) {
        int y = (year != null) ? year : systemSettingService.getCurrentSchoolYear();
        return ResponseEntity.ok(studentService.getOpenClassrooms(y));
    }

    // 현재 학년도
    @GetMapping("/current-year")
    public ResponseEntity<Integer> currentYear() {
        return ResponseEntity.ok(systemSettingService.getCurrentSchoolYear());
    }

    // 학적 이력 수정
    @PutMapping("/assignment")
    public ResponseEntity<String> updateAssignment(@RequestBody StudentDTO.AssignmentRequest request) {
        try {
            studentService.updateAssignment(request);
            return ResponseEntity.ok("수정되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 학적 이력 삭제
    @DeleteMapping("/{uid}/assignment/{schoolYear}")
    public ResponseEntity<String> deleteAssignment(@PathVariable Long uid, @PathVariable int schoolYear) {
        studentService.deleteAssignment(uid, schoolYear);
        return ResponseEntity.ok("삭제되었습니다.");
    }

    // 보호자 검색
    @GetMapping("/search-parent")
    public ResponseEntity<Page<ParentDTO.Summary>> searchParent(@RequestParam String keyword, Pageable pageable) {
        ParentDTO.ParentSearchCondition cond = new ParentDTO.ParentSearchCondition();
        cond.setType("name");
        cond.setKeyword(keyword);
        return ResponseEntity.ok(parentService.getParentList(cond, pageable));
    }

    // 보호자 추가
    @PostMapping("/{uid}/guardian")
    public ResponseEntity<String> addGuardian(@PathVariable Long uid,
            @RequestParam Long parentId, @RequestParam FamilyRelationship relationship) {
        studentService.addGuardian(uid, parentId, relationship);
        return ResponseEntity.ok("추가되었습니다.");
    }

    // 보호자 관계 수정
    @PutMapping("/{uid}/guardian")
    public ResponseEntity<String> updateGuardian(@PathVariable Long uid,
            @RequestParam Long parentId, @RequestParam FamilyRelationship relationship) {
        studentService.updateGuardianRelationship(uid, parentId, relationship);
        return ResponseEntity.ok("수정되었습니다.");
    }

    // 보호자 해제
    @DeleteMapping("/{uid}/guardian/{parentId}")
    public ResponseEntity<String> removeGuardian(@PathVariable Long uid, @PathVariable Long parentId) {
        studentService.removeGuardian(uid, parentId);
        return ResponseEntity.ok("해제되었습니다.");
    }
}
