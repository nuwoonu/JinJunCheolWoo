package com.example.schoolmate.domain.board.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.board.entity.BoardConsent;

// [woo] 가정통신문 회신(동의) 레포지토리
public interface BoardConsentRepository extends JpaRepository<BoardConsent, Long> {

    Optional<BoardConsent> findByBoardIdAndUserUid(Long boardId, Long userUid);

    boolean existsByBoardIdAndUserUid(Long boardId, Long userUid);

    List<BoardConsent> findByBoardId(Long boardId);

    // 게시물별 동의 수
    long countByBoardIdAndAgreedTrue(Long boardId);

    // 게시물별 비동의 수
    long countByBoardIdAndAgreedFalse(Long boardId);

    // 게시물별 전체 회신 수
    long countByBoardId(Long boardId);

    // 특정 게시물에 회신한 유저 uid 목록
    @Query("SELECT bc.user.uid FROM BoardConsent bc WHERE bc.board.id = :boardId")
    Set<Long> findConsentUserUidsByBoardId(@Param("boardId") Long boardId);
}
