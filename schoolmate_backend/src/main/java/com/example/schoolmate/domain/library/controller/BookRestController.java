package com.example.schoolmate.domain.library.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
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

import com.example.schoolmate.domain.library.dto.BookDTO;
import com.example.schoolmate.domain.library.entity.constant.BookCategory;
import com.example.schoolmate.domain.library.service.BookService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 도서 카탈로그 REST API
 *
 * - 학생/교사 공통: 도서 검색, 상세, 인기/최근
 * - 교사/관리자: 도서 등록/수정/삭제
 */
@Slf4j
@RestController
@RequestMapping("/api/library/books")
@RequiredArgsConstructor
public class BookRestController {

    private final BookService bookService;

    /** 도서 검색 + 목록 */
    @GetMapping
    public ResponseEntity<Page<BookDTO.ListResponse>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BookCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(bookService.search(keyword, category, page, size));
    }

    /** 인기 도서 */
    @GetMapping("/popular")
    public ResponseEntity<List<BookDTO.ListResponse>> popular(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(bookService.getPopular(limit));
    }

    /** 최근 등록 도서 */
    @GetMapping("/recent")
    public ResponseEntity<List<BookDTO.ListResponse>> recent(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(bookService.getRecent(limit));
    }

    /** 도서 상세 */
    @GetMapping("/{id}")
    public ResponseEntity<BookDTO.DetailResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getById(id));
    }

    /** 도서 등록 (교사/관리자) */
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody BookDTO.CreateRequest request) {
        try {
            return ResponseEntity.ok(bookService.create(request));
        } catch (IllegalArgumentException e) {
            log.warn("[library] 도서 등록 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** 도서 수정 (교사/관리자) */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
            @RequestBody BookDTO.UpdateRequest request) {
        try {
            return ResponseEntity.ok(bookService.update(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** 도서 삭제(소프트) */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            bookService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // [woo] 표지 이미지 일괄 업데이트 (교사/관리자 전용)
    @PostMapping("/refresh-covers")
    public ResponseEntity<Map<String, Integer>> refreshCovers() {
        int updatedCount = bookService.refreshCovers();
        return ResponseEntity.ok(Map.of("updatedCount", updatedCount));
    }
}
