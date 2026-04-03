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

    /** 특정 학급 대상 게시판 + 선택적 키워드/검색타입 */
    // [soojin] keyword, searchType 파라미터 추가 - 전체/제목/내용/작성자 필터 검색 지원
    Page<Board> findByTypeAndClassroom(BoardType type, Long classroomId, String keyword, String searchType, Pageable pageable);

    /** 학부모 게시판 - 학년별 (해당 학년 + 전체 공지 포함) */
    Page<Board> findParentByGrade(BoardType type, int grade, Pageable pageable);

    /** 학부모 게시판 - 학급별 (해당 학급 + 해당 학년 전체 + 전체 공지 포함) */
    // [soojin] keyword 검색 지원 추가 (가정통신문 학부모 뷰 검색 기능)
    Page<Board> findParentByClassroom(BoardType type, Long classroomId, int grade, String keyword, Pageable pageable);

    /** 최근 게시물 조회 (대시보드용) */
    List<Board> findRecentByType(BoardType type, int limit);

    // [soojin] 인기글/통계 조회 - 학급 게시판 사이드바용
    /** 조회수 기준 상위 N개 (인기글 사이드바용) */
    List<Board> findTopByViewCount(BoardType boardType, int limit);

    /** 전체 게시글 수 */
    long countByType(BoardType boardType);

    /** 전체 조회수 합계 */
    long sumViewCountByType(BoardType boardType);

    // [soojin] 오늘 작성된 게시글 수 - 게시판 통계 카드용
    long countTodayByType(BoardType boardType);
}
