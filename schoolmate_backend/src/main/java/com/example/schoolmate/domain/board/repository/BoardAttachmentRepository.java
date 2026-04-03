package com.example.schoolmate.domain.board.repository;

import com.example.schoolmate.domain.board.entity.BoardAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// [soojin] 게시글 다중 첨부파일 리포지토리
public interface BoardAttachmentRepository extends JpaRepository<BoardAttachment, Long> {

    // [soojin] 게시글의 첨부파일 목록 (업로드 순 정렬)
    List<BoardAttachment> findByBoard_IdOrderBySortOrder(Long boardId);

    // [soojin] 게시글 삭제/수정 시 기존 첨부파일 일괄 삭제
    @Modifying
    @Transactional
    void deleteByBoard_Id(Long boardId);
}
