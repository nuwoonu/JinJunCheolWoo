package com.example.schoolmate.domain.admin.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.domain.board.dto.BoardDTO;
import com.example.schoolmate.domain.board.entity.BoardType;
import com.example.schoolmate.domain.board.service.BoardService;
import com.example.schoolmate.global.config.SchoolmateUrls;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;

// 공지사항 관리 REST API
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_NOTICES)
@RequiredArgsConstructor
@PreAuthorize("@grants.canManageNotices()")
public class AdminNoticeApiController {

    private final BoardService boardService;

    @GetMapping
    public ResponseEntity<Page<BoardDTO.Response>> list(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(boardService.getSchoolNotices(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoardDTO.Response> detail(@PathVariable Long id) {
        boardService.incrementViewCount(id);
        // [soojin] 관리자 공지 상세에 좋아요 기능 없음 → userUid null 전달
        return ResponseEntity.ok(boardService.getBoardReadOnly(id, null));
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @RequestBody BoardDTO.Request request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        request.setBoardType(BoardType.SCHOOL_NOTICE);
        boardService.createBoard(request, authUser.getCustomUserDTO());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @RequestBody BoardDTO.Request request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        boardService.updateBoard(id, request, authUser.getCustomUserDTO());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        boardService.deleteBoard(id, authUser.getCustomUserDTO());
        return ResponseEntity.ok().build();
    }
}
