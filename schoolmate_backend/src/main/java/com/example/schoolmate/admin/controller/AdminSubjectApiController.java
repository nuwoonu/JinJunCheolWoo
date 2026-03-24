package com.example.schoolmate.admin.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.cheol.dto.SubjectDTO;
import com.example.schoolmate.common.service.SubjectService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * 교과목 관리 REST API
 * - GET  /admin/subjects           : 과목 목록 조회
 * - POST /admin/subjects           : 과목 단건 등록
 * - PUT  /admin/subjects           : 과목 수정
 * - DELETE /admin/subjects/{code}  : 과목 삭제
 * - POST /admin/subjects/import-csv: CSV 일괄 등록
 */
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_SUBJECTS)
@RequiredArgsConstructor
public class AdminSubjectApiController {

    private final SubjectService subjectService;

    /** 과목 목록 조회 — 교사 등록·수정 폼 드롭다운용으로 일반 어드민도 읽기 허용 */
    @GetMapping
    @PreAuthorize("@grants.canAccessAdmin()")
    public ResponseEntity<List<?>> list() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @PostMapping
    @PreAuthorize("@grants.isSuperAdmin()")
    public ResponseEntity<Void> create(@RequestBody SubjectDTO.Request request) {
        subjectService.createSubject(request);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    @PreAuthorize("@grants.isSuperAdmin()")
    public ResponseEntity<Void> update(@RequestBody SubjectDTO.Request request) {
        subjectService.updateSubject(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("@grants.isSuperAdmin()")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        subjectService.deleteSubject(code);
        return ResponseEntity.ok().build();
    }

    /**
     * CSV 파일로 과목 일괄 등록
     *
     * CSV 형식 (헤더 필수): 코드,과목명,학년
     * - 학년: FIRST / SECOND / THIRD (생략 가능)
     * - 이미 존재하는 코드는 건너뜁니다.
     *
     * @return 처리 결과 메시지 목록
     */
    @PostMapping("/import-csv")
    @PreAuthorize("@grants.isSuperAdmin()")
    public ResponseEntity<List<String>> importCsv(@RequestParam MultipartFile file) {
        try {
            List<String> results = subjectService.importFromCsv(file);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("과목 CSV 가져오기 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of("처리 실패: " + e.getMessage()));
        }
    }
}
