package com.example.schoolmate.board.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.schoolmate.board.entity.Board;
import com.example.schoolmate.board.entity.BoardType;

@Repository

public interface BoardRepository extends JpaRepository<Board, Long> {
    // ========== 학교 공지 ==========
    // 학교 공지 목록 (삭제되지 않은 것만, 고정글 우선 + 최신순)
    @Query("SELECT b FROM Board b WHERE b.boardType = :type AND b.isDeleted = false " +
           "ORDER BY b.isPinned DESC, b.createDate DESC")
    Page<Board> findByBoardType(@Param("type") BoardType type, Pageable pageable);

    // ========== 학년 게시판 ==========
    // 특정 학년 게시판 목록
    @Query("SELECT b FROM Board b WHERE b.boardType = :type AND b.targetGrade = :grade " +
           "AND b.isDeleted = false ORDER BY b.isPinned DESC, b.createDate DESC")
    Page<Board> findByBoardTypeAndTargetGrade(
            @Param("type") BoardType type,
            @Param("grade") Integer grade,
            Pageable pageable);

    // ========== 학급 게시판 ==========
    // 특정 학급 게시판 목록
    @Query("SELECT b FROM Board b WHERE b.boardType = :type AND b.targetClassroom.cid = :classroomId " +
           "AND b.isDeleted = false ORDER BY b.isPinned DESC, b.createDate DESC")
    Page<Board> findByBoardTypeAndTargetClassroomId(
            @Param("type") BoardType type,
            @Param("classroomId") Long classroomId,
            Pageable pageable);

    // ========== 학부모 게시판 (학년별) ==========
    // 학년별 학부모 공지/게시판
    @Query("SELECT b FROM Board b WHERE b.boardType = :type AND " +
           "(b.targetGrade = :grade OR b.targetGrade IS NULL) AND b.targetClassroom IS NULL " +
           "AND b.isDeleted = false ORDER BY b.isPinned DESC, b.createDate DESC")
    Page<Board> findParentBoardByGrade(
            @Param("type") BoardType type,
            @Param("grade") Integer grade,
            Pageable pageable);

    // ========== 학부모 게시판 (학급별) ==========
    // 학급별 학부모 공지/게시판 (학급 + 학년 전체 + 전체 모두 포함)
    @Query("SELECT b FROM Board b WHERE b.boardType = :type AND " +
           "(b.targetClassroom.cid = :classroomId OR " +
           "(b.targetGrade = :grade AND b.targetClassroom IS NULL) OR " +
           "(b.targetGrade IS NULL AND b.targetClassroom IS NULL)) " +
           "AND b.isDeleted = false ORDER BY b.isPinned DESC, b.createDate DESC")
    Page<Board> findParentBoardByClassroom(
            @Param("type") BoardType type,
            @Param("classroomId") Long classroomId,
            @Param("grade") Integer grade,
            Pageable pageable);

    // ========== 교직원 게시판 ==========
    // 교직원 게시판 (전체)
    @Query("SELECT b FROM Board b WHERE b.boardType = :type " +
           "AND b.isDeleted = false ORDER BY b.isPinned DESC, b.createDate DESC")
    Page<Board> findTeacherBoard(@Param("type") BoardType type, Pageable pageable);

    // ========== 검색 ==========
    // 제목으로 검색
    @Query("SELECT b FROM Board b WHERE b.boardType = :type AND b.isDeleted = false " +
           "AND b.title LIKE %:keyword% ORDER BY b.isPinned DESC, b.createDate DESC")
    Page<Board> searchByTitle(
            @Param("type") BoardType type,
            @Param("keyword") String keyword,
            Pageable pageable);

    // 제목+내용으로 검색
    @Query("SELECT b FROM Board b WHERE b.boardType = :type AND b.isDeleted = false " +
           "AND (b.title LIKE %:keyword% OR b.content LIKE %:keyword%) " +
           "ORDER BY b.isPinned DESC, b.createDate DESC")
    Page<Board> searchByTitleOrContent(
            @Param("type") BoardType type,
            @Param("keyword") String keyword,
            Pageable pageable);

    // ========== 최근 게시물 ==========
    // 최근 N개 게시물 (대시보드용)
    List<Board> findTop5ByBoardTypeAndIsDeletedFalseOrderByCreateDateDesc(BoardType type);

    // 특정 학년 최근 게시물
    List<Board> findTop5ByBoardTypeAndTargetGradeAndIsDeletedFalseOrderByCreateDateDesc(
            BoardType type, Integer grade);

    // ========== 작성자별 ==========
    // 내가 쓴 글 목록
    @Query("SELECT b FROM Board b WHERE b.writer.uid = :writerId AND b.isDeleted = false " +
           "ORDER BY b.createDate DESC")
    Page<Board> findByWriterId(@Param("writerId") Long writerId, Pageable pageable);
}
