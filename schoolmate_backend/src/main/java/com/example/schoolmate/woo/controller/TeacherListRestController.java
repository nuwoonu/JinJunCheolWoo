package com.example.schoolmate.woo.controller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.service.ParentService;
import com.example.schoolmate.common.service.TeacherService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * [woo] 교사/학부모 목록 REST API - React 페이지 연동용
 * GET /api/teacher/list  → 선생님 목록
 * GET /api/teacher/parents → 학부모 목록
 */
@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@RequiredArgsConstructor
@Log4j2
public class TeacherListRestController {

    private final TeacherService teacherService;
    private final ParentService parentService;

    /**
     * 선생님 목록 조회 (React /teacher/list)
     *
     * GET /api/teacher/list?page=0&size=10&keyword=&status=
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getTeacherList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {

        TeacherDTO.TeacherSearchCondition condition = new TeacherDTO.TeacherSearchCondition();
        condition.setKeyword(keyword);
        condition.setStatus(status);

        Page<TeacherDTO.DetailResponse> result = teacherService.getTeacherList(
                condition, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "uid")));

        log.info("[REST] 선생님 목록 조회 - page: {}, total: {}", page, result.getTotalElements());

        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

    /**
     * 학부모 목록 조회 (React /teacher/parent/list)
     *
     * GET /api/teacher/parents?page=0&size=10
     */
    @GetMapping("/parents")
    public ResponseEntity<Map<String, Object>> getParentList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {

        ParentDTO.ParentSearchCondition condition = new ParentDTO.ParentSearchCondition();
        condition.setKeyword(keyword);

        Page<ParentDTO.Summary> result = parentService.getParentList(
                condition, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")));

        log.info("[REST] 학부모 목록 조회 - page: {}, total: {}", page, result.getTotalElements());

        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }
}
