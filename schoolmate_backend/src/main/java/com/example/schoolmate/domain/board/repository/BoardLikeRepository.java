package com.example.schoolmate.domain.board.repository;

import com.example.schoolmate.domain.board.entity.BoardLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// [soojin] 게시글 좋아요 레포지토리 - 토글 기능 지원
public interface BoardLikeRepository extends JpaRepository<BoardLike, Long> {

    boolean existsByBoard_IdAndUser_Uid(Long boardId, Long userUid);

    Optional<BoardLike> findByBoard_IdAndUser_Uid(Long boardId, Long userUid);

    long countByBoard_Id(Long boardId);
}
