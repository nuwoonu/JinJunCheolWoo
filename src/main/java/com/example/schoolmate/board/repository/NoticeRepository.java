package com.example.schoolmate.board.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.board.entity.Notice;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // 공지 목록 (작성자 포함)
    @Query("SELECT n, n.writer FROM Notice n ORDER BY n.nno DESC")
    Page<Object[]> getListWithWriter(Pageable pageable);

    // 검색 기능
    @Query("SELECT n, n.writer FROM Notice n " +
            "WHERE (:type IS NULL OR :type = '' OR " +
            "(:type = 't' AND n.title LIKE %:keyword%) OR " +
            "(:type = 'c' AND n.content LIKE %:keyword%) OR " +
            "(:type = 'w' AND n.writer.name LIKE %:keyword%) OR " +
            "(:type = 'tc' AND (n.title LIKE %:keyword% OR n.content LIKE %:keyword%))) " +
            "ORDER BY n.nno DESC")
    Page<Object[]> searchList(@Param("type") String type, @Param("keyword") String keyword, Pageable pageable);

    // 단건 조회 (작성자 포함)
    @Query("SELECT n, n.writer FROM Notice n WHERE n.nno = :nno")
    Object getNoticeByNno(@Param("nno") Long nno);
}
