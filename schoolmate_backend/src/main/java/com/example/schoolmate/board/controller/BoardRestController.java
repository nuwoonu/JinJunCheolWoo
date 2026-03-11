package com.example.schoolmate.board.controller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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

import com.example.schoolmate.board.dto.BoardRequestDTO;
import com.example.schoolmate.board.dto.BoardResponseDTO;
import com.example.schoolmate.board.entity.BoardType;
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

    // ========== [woo] React 페이지용 GET API ==========

    /**
     * [cheol] 학년 게시판 목록 (React /board/grade/:grade)
     * GET /api/board/grade/{grade}?page=0&size=10
     */
    @GetMapping("/grade/{grade}")
    public ResponseEntity<Map<String, Object>> getGradeBoard(
            @PathVariable int grade,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<BoardResponseDTO> result = boardService.getGradeBoard(grade, PageRequest.of(page, size));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

    /**
     * 학교 공지 목록 (React /board/school-notice)
     * GET /api/board/school-notice?page=0&size=10
     */
    @GetMapping("/school-notice")
    public ResponseEntity<Map<String, Object>> getSchoolNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<BoardResponseDTO> result = boardService.getSchoolNotices(PageRequest.of(page, size));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

    /**
     * [woo] 게시물 상세 조회 - 읽기전용 (조회수 증가 없음)
     * GET /api/board/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<BoardResponseDTO> getBoard(@PathVariable Long id) {
        BoardResponseDTO board = boardService.getBoardReadOnly(id);
        return ResponseEntity.ok(board);
    }

    /**
     * [woo] 조회수 증가 - React 상세 페이지 진입 시 별도 호출
     * POST /api/board/{id}/view
     */
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> incrementView(@PathVariable Long id) {
        boardService.incrementViewCount(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 학부모 공지 목록 (React /board/parent-notice)
     * GET /api/board/parent-notice?page=0&size=10
     */
    @GetMapping("/parent-notice")
    public ResponseEntity<Map<String, Object>> getParentNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<BoardResponseDTO> result = boardService.getParentNotices(PageRequest.of(page, size));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

    /**
     * 학부모 게시판 목록 (React /board/parent)
     * GET /api/board/parent-board?page=0&size=10
     */
    @GetMapping("/parent-board")
    public ResponseEntity<Map<String, Object>> getParentBoard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<BoardResponseDTO> result = boardService.getParentBoard(PageRequest.of(page, size));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

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
