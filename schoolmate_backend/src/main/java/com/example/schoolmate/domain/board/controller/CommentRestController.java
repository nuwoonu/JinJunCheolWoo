package com.example.schoolmate.domain.board.controller;

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

import com.example.schoolmate.domain.board.dto.CommentDTO;
import com.example.schoolmate.domain.board.service.CommentService;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;

// [soojin] 댓글 REST API - 최상위 댓글 + 대댓글 지원
@RestController
@RequestMapping("/api/board/{boardId}/comments")
@RequiredArgsConstructor
public class CommentRestController {

    private final CommentService commentService;

    /**
     * 댓글 목록 조회 (replies 포함)
     * GET /api/board/{boardId}/comments
     */
    @GetMapping
    public ResponseEntity<List<CommentDTO.Response>> getComments(@PathVariable Long boardId) {
        return ResponseEntity.ok(commentService.getComments(boardId));
    }

    /**
     * 댓글 작성
     * POST /api/board/{boardId}/comments
     * body: { "content": "...", "parentId": null or commentId }
     */
    @PostMapping
    public ResponseEntity<?> createComment(
            @PathVariable Long boardId,
            @RequestBody CommentDTO.Request request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            CommentDTO.Response result = commentService.createComment(boardId, request, authUser.getCustomUserDTO());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 댓글 삭제 (soft delete)
     * DELETE /api/board/{boardId}/comments/{commentId}
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long boardId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            commentService.deleteComment(commentId, authUser.getCustomUserDTO());
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
