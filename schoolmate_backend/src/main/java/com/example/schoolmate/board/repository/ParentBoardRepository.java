package com.example.schoolmate.board.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.board.entity.ParentBoard;

public interface ParentBoardRepository extends JpaRepository<ParentBoard, Long> {

    // 게시글 목록 (작성자 포함)
    @Query("SELECT b, b.writer FROM ParentBoard b ORDER BY b.bno DESC")
    Page<Object[]> getListWithWriter(Pageable pageable);

    // 검색 기능
    @Query("SELECT b, b.writer FROM ParentBoard b " +
           "WHERE (:type IS NULL OR :type = '' OR " +
           "(:type = 't' AND b.title LIKE %:keyword%) OR " +
           "(:type = 'c' AND b.content LIKE %:keyword%) OR " +
           "(:type = 'w' AND b.writer.name LIKE %:keyword%) OR " +
           "(:type = 'tc' AND (b.title LIKE %:keyword% OR b.content LIKE %:keyword%))) " +
           "ORDER BY b.bno DESC")
    Page<Object[]> searchList(@Param("type") String type, @Param("keyword") String keyword, Pageable pageable);

    // 단건 조회 (작성자 포함)
    @Query("SELECT b, b.writer FROM ParentBoard b WHERE b.bno = :bno")
    Object getBoardByBno(@Param("bno") Long bno);
}
