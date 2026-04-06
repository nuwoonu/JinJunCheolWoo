package com.example.schoolmate.domain.quiz.controller;

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
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.user.dto.AuthUserDTO;
import com.example.schoolmate.domain.quiz.dto.QuizDTO;
import com.example.schoolmate.domain.quiz.entity.Quiz;
import com.example.schoolmate.domain.quiz.service.QuizService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [woo] 퀴즈 REST API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizRestController {

    private final QuizService quizService;

    // ========== [woo] 퀴즈 출제 (교사) ==========

    @PostMapping
    public ResponseEntity<?> createQuiz(
            @RequestBody @Valid QuizDTO.CreateRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            QuizDTO.DetailResponse response = quizService.createQuiz(request, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("[woo] 퀴즈 출제 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 퀴즈 목록 ==========

    @GetMapping("/teacher")
    public ResponseEntity<Map<String, Object>> getTeacherQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Page<QuizDTO.ListResponse> result = quizService.getTeacherQuizzes(
                authUser.getCustomUserDTO(),
                PageRequest.of(page, size, Sort.by("createDate").descending()));

        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    // ========== [woo] 학부모: 자녀 퀴즈 목록 ==========

    @GetMapping("/parent/{childUserUid}")
    public ResponseEntity<?> getChildQuizzes(
            @PathVariable Long childUserUid,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            return ResponseEntity.ok(quizService.getChildQuizzes(authUser.getCustomUserDTO(), childUserUid));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/student")
    public ResponseEntity<Map<String, Object>> getStudentQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Page<QuizDTO.ListResponse> result = quizService.getStudentQuizzes(
                authUser.getCustomUserDTO(),
                PageRequest.of(page, size, Sort.by("createDate").descending()));

        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    // ========== [woo] 퀴즈 상세 ==========

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            QuizDTO.DetailResponse response = quizService.getQuiz(id, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 퀴즈 제출 (학생) ==========

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitQuiz(
            @PathVariable Long id,
            @RequestBody @Valid QuizDTO.SubmitRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            QuizDTO.SubmissionResponse response = quizService.submitQuiz(
                    id, request, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 퀴즈 수정 (교사) ==========
    // [woo] 트랜잭션 분리: ① 문제/선택지 업데이트 → 커밋 → ② 재채점 (별도 세션)

    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuiz(
            @PathVariable Long id,
            @RequestBody @Valid QuizDTO.CreateRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            // [woo] 트랜잭션 1: 퀴즈 기본 정보 + 문제/선택지 수정
            quizService.updateQuiz(id, request, authUser.getCustomUserDTO());

            // [woo] 트랜잭션 2: 새 세션에서 기존 응시 기록 재채점 + 응답 생성
            QuizDTO.DetailResponse response = quizService.regradeAndGetQuiz(id);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("[woo] 퀴즈 수정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 퀴즈 삭제 (교사) ==========

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            quizService.deleteQuiz(id, authUser.getCustomUserDTO());
            return ResponseEntity.ok().body("삭제되었습니다.");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 퀴즈 상태 변경 (교사) ==========

    @PostMapping("/{id}/status")
    public ResponseEntity<?> changeStatus(
            @PathVariable Long id,
            @RequestParam Quiz.QuizStatus status,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            quizService.changeQuizStatus(id, status, authUser.getCustomUserDTO());
            return ResponseEntity.ok().body("상태가 변경되었습니다.");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
