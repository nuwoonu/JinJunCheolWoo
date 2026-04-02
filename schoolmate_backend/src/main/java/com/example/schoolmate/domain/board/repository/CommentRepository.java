package com.example.schoolmate.domain.board.repository;

import com.example.schoolmate.domain.board.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// [soojin] 게시글 댓글 레포지토리 - 대댓글 계층 구조 지원
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 게시글의 최상위 댓글 목록 (parent가 null인 것만)
    List<Comment> findByBoard_IdAndParentIsNullOrderByCreateDateAsc(Long boardId);

    // 특정 댓글의 대댓글 목록
    List<Comment> findByParent_IdOrderByCreateDateAsc(Long parentId);

    // 게시글 댓글 수 (삭제 여부 무관하게 카운트해서 "N개의 댓글" 표시)
    long countByBoard_IdAndIsDeletedFalse(Long boardId);
}
