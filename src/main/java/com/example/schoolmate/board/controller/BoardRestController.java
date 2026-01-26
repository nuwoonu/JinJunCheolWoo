package com.example.schoolmate.board.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.board.dto.BoardRequestDTO;
import com.example.schoolmate.board.dto.BoardResponseDTO;
import com.example.schoolmate.board.service.BoardService;
import com.example.schoolmate.dto.AuthUserDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [woo] 게시판 REST API 컨트롤러
 * - 게시물 작성, 수정, 삭제
 */
@Slf4j
@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardRestController {

    private final BoardService boardService;

    /**
     * 게시물 작성
     */
    @PostMapping
    public ResponseEntity<?> createBoard(
            @Valid @RequestBody BoardRequestDTO request,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        try {
            BoardResponseDTO response = boardService.createBoard(request, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            log.warn("게시물 작성 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("게시물 작성 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 게시물 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBoard(
            @PathVariable Long id,
            @Valid @RequestBody BoardRequestDTO request,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        try {
            BoardResponseDTO response = boardService.updateBoard(id, request, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            log.warn("게시물 수정 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("게시물 수정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 게시물 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBoard(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        try {
            boardService.deleteBoard(id, authUser.getCustomUserDTO());
            return ResponseEntity.ok().body("삭제되었습니다.");
        } catch (SecurityException e) {
            log.warn("게시물 삭제 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("게시물 삭제 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 상단 고정 토글 (ADMIN만)
     */
    @PostMapping("/{id}/pin")
    public ResponseEntity<?> togglePinned(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        try {
            boardService.togglePinned(id, authUser.getCustomUserDTO());
            return ResponseEntity.ok().body("상단 고정이 변경되었습니다.");
        } catch (SecurityException e) {
            log.warn("상단 고정 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("상단 고정 변경 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
