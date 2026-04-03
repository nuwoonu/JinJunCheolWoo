package com.example.schoolmate.domain.board.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// [soojin] 게시글 다중 첨부파일 엔티티 - board당 여러 파일 지원
@Entity
@Table(
    name = "board_attachment",
    indexes = @Index(name = "idx_board_attachment_board", columnList = "board_id")
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    // [soojin] 사용자에게 보여줄 원본 파일명
    @Column(nullable = false)
    private String originalName;

    // [soojin] 서버에 저장된 UUID 기반 파일명 (/api/board/file/{storedName}으로 서빙)
    @Column(nullable = false)
    private String storedName;

    // [soojin] 파일 크기 (bytes) - 프론트 "245KB" 표시용
    private Long fileSize;

    // [soojin] MIME 타입 (application/pdf, image/png 등)
    private String fileType;

    // [soojin] 정렬 순서 (업로드 순)
    @Builder.Default
    @Column(nullable = false)
    private int sortOrder = 0;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
