package com.example.schoolmate.domain.board.repository;

import com.example.schoolmate.domain.board.entity.BoardBookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// [soojin] 게시글 북마크 리포지토리 - 토글 기능 지원
public interface BoardBookmarkRepository extends JpaRepository<BoardBookmark, Long> {

    boolean existsByBoard_IdAndUser_Uid(Long boardId, Long userUid);

    Optional<BoardBookmark> findByBoard_IdAndUser_Uid(Long boardId, Long userUid);
}
