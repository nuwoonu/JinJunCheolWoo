package com.example.schoolmate.domain.board.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.domain.board.entity.Board;
import com.example.schoolmate.domain.board.entity.BoardType;

public interface BoardRepositoryCustom {

    /** 타입 + 선택적 키워드 검색 (학교 필터 자동 적용) */
    Page<Board> findByType(BoardType type, String keyword, Pageable pageable);

    /** 특정 학년 대상 게시판 */
    Page<Board> findByTypeAndGrade(BoardType type, int grade, Pageable pageable);

    /** 특정 학급 대상 게시판 */
    Page<Board> findByTypeAndClassroom(BoardType type, Long classroomId, Pageable pageable);

    /** 학부모 게시판 - 학년별 (해당 학년 + 전체 공지 포함) */
    Page<Board> findParentByGrade(BoardType type, int grade, Pageable pageable);

    /** 학부모 게시판 - 학급별 (해당 학급 + 해당 학년 전체 + 전체 공지 포함) */
    Page<Board> findParentByClassroom(BoardType type, Long classroomId, int grade, Pageable pageable);

    /** 최근 게시물 조회 (대시보드용) */
    List<Board> findRecentByType(BoardType type, int limit);
}
