package com.example.schoolmate.domain.library.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.library.dto.BookLoanDTO;
import com.example.schoolmate.domain.library.dto.ReadingStatsDTO;
import com.example.schoolmate.domain.library.service.BookLoanService;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 도서 대출 REST API
 *
 * 학생 본인의 대출 생성/반납/연장과 현재 대출/연체/통계 조회를 제공합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/library/loans")
@RequiredArgsConstructor
public class BookLoanRestController {

    private final BookLoanService bookLoanService;

    /** 대출 신청 */
    @PostMapping
    public ResponseEntity<?> borrow(
            @Valid @RequestBody BookLoanDTO.BorrowRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            return ResponseEntity.ok(bookLoanService.borrow(request.getBookId(), authUser));
        } catch (IllegalStateException | IllegalArgumentException e) {
            log.warn("[library] 대출 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** 반납 */
    @PostMapping("/{loanId}/return")
    public ResponseEntity<?> returnLoan(
            @PathVariable Long loanId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            return ResponseEntity.ok(bookLoanService.returnLoan(loanId, authUser));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** 연장 */
    @PostMapping("/{loanId}/extend")
    public ResponseEntity<?> extend(
            @PathVariable Long loanId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            return ResponseEntity.ok(bookLoanService.extend(loanId, authUser));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** 내 대출중 도서 */
    @GetMapping("/my/borrowed")
    public ResponseEntity<List<BookLoanDTO.Response>> myBorrowed(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        return ResponseEntity.ok(bookLoanService.getMyBorrowed(authUser));
    }

    /** 내 연체 도서 */
    @GetMapping("/my/overdue")
    public ResponseEntity<List<BookLoanDTO.Response>> myOverdue(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        return ResponseEntity.ok(bookLoanService.getMyOverdue(authUser));
    }

    /** 내 전체 대출 이력 */
    @GetMapping("/my/history")
    public ResponseEntity<List<BookLoanDTO.Response>> myHistory(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        return ResponseEntity.ok(bookLoanService.getMyHistory(authUser));
    }

    /** 내 독서 통계 */
    @GetMapping("/my/stats")
    public ResponseEntity<ReadingStatsDTO> myStats(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        return ResponseEntity.ok(bookLoanService.getMyStats(authUser));
    }
}
