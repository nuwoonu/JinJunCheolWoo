package com.example.schoolmate.domain.library.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.library.dto.BookReviewDTO;
import com.example.schoolmate.domain.library.service.BookReviewService;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 도서 리뷰 REST API
 */
@Slf4j
@RestController
@RequestMapping("/api/library/books/{bookId}/reviews")
@RequiredArgsConstructor
public class BookReviewRestController {

    private final BookReviewService bookReviewService;

    /** 도서의 리뷰 목록 */
    @GetMapping
    public ResponseEntity<List<BookReviewDTO.Response>> list(@PathVariable Long bookId) {
        return ResponseEntity.ok(bookReviewService.getByBook(bookId));
    }

    /** 리뷰 작성/수정 (1책 1리뷰) */
    @PostMapping
    public ResponseEntity<?> upsert(
            @PathVariable Long bookId,
            @Valid @RequestBody BookReviewDTO.UpsertRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            return ResponseEntity.ok(bookReviewService.upsert(bookId, request, authUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** 리뷰 삭제 */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> delete(
            @PathVariable Long bookId,
            @PathVariable Long reviewId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            bookReviewService.delete(reviewId, authUser);
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
