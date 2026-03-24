package com.example.schoolmate.domain.board.repository;

import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.board.entity.BoardRead;
import com.example.schoolmate.domain.board.entity.BoardType;

// [woo] 게시물 읽음 여부 레포지토리
public interface BoardReadRepository extends JpaRepository<BoardRead, Long> {

    boolean existsByBoardIdAndUserUid(Long boardId, Long userUid);

    // 게시물 1건의 읽음 수 (교사 목록에서 표시용)
    long countByBoardId(Long boardId);

    // 게시물을 읽은 유저 uid 목록
    @Query("SELECT br.user.uid FROM BoardRead br WHERE br.board.id = :boardId")
    Set<Long> findReadUserUidsByBoardId(@Param("boardId") Long boardId);

    // 특정 유저가 읽은 게시물 ID 목록 (boardType 필터)
    @Query("SELECT br.board.id FROM BoardRead br WHERE br.user.uid = :userUid AND br.board.boardType = :boardType")
    Set<Long> findReadBoardIdsByUserAndType(@Param("userUid") Long userUid, @Param("boardType") BoardType boardType);

    // 특정 유저의 안읽은 게시물 수 (boardType 필터)
    @Query("SELECT COUNT(b) FROM Board b WHERE b.boardType = :boardType AND b.isDeleted = false " +
           "AND b.id NOT IN (SELECT br.board.id FROM BoardRead br WHERE br.user.uid = :userUid)")
    long countUnreadByUserAndType(@Param("userUid") Long userUid, @Param("boardType") BoardType boardType);
}
