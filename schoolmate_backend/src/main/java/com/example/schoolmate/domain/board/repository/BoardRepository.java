package com.example.schoolmate.domain.board.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.schoolmate.domain.board.entity.Board;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long>, BoardRepositoryCustom {

       // ========== 작성자별 ==========
       @Query("SELECT b FROM Board b WHERE b.writer.uid = :writerId AND b.isDeleted = false " +
                     "ORDER BY b.createDate DESC")
       Page<Board> findByWriterId(@Param("writerId") Long writerId, Pageable pageable);
}
