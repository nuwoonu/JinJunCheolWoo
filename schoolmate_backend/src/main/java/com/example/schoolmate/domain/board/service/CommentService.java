package com.example.schoolmate.domain.board.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.board.dto.CommentDTO;
import com.example.schoolmate.domain.board.entity.Comment;
import com.example.schoolmate.domain.board.repository.BoardRepository;
import com.example.schoolmate.domain.board.repository.CommentRepository;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.dto.CustomUserDTO;

import lombok.RequiredArgsConstructor;

// [soojin] 댓글 서비스 - 최상위 댓글 + 대댓글 계층 구조 지원
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    /**
     * 댓글 목록 조회 — 최상위 댓글 + 각 댓글의 대댓글(replies) 포함
     */
    public List<CommentDTO.Response> getComments(Long boardId) {
        List<Comment> topLevel = commentRepository.findByBoard_IdAndParentIsNullOrderByCreateDateAsc(boardId);
        return topLevel.stream().map(comment -> {
            CommentDTO.Response dto = CommentDTO.Response.from(comment);
            List<CommentDTO.Response> replies = commentRepository
                    .findByParent_IdOrderByCreateDateAsc(comment.getId())
                    .stream()
                    .map(CommentDTO.Response::from)
                    .collect(Collectors.toList());
            dto.setReplies(replies);
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * 댓글 작성
     */
    @Transactional
    public CommentDTO.Response createComment(Long boardId, CommentDTO.Request request, CustomUserDTO userDTO) {
        var board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        User writer = userRepository.findById(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다."));
        }

        Comment comment = Comment.builder()
                .board(board)
                .parent(parent)
                .writer(writer)
                .content(request.getContent())
                .build();

        Comment saved = commentRepository.save(comment);
        CommentDTO.Response dto = CommentDTO.Response.from(saved);
        dto.setReplies(List.of());
        return dto;
    }

    /**
     * 댓글 삭제 (soft delete — 작성자 또는 ADMIN/TEACHER)
     */
    @Transactional
    public void deleteComment(Long commentId, CustomUserDTO userDTO) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        boolean isWriter = comment.getWriter().getUid().equals(userDTO.getUid());
        boolean isAdminOrTeacher = userDTO.hasRole(UserRole.ADMIN) || userDTO.hasRole(UserRole.TEACHER)
                || UserRole.ADMIN.equals(userDTO.getRole()) || UserRole.TEACHER.equals(userDTO.getRole());

        if (!isWriter && !isAdminOrTeacher) {
            throw new SecurityException("댓글 삭제 권한이 없습니다.");
        }

        comment.delete();
    }
}
