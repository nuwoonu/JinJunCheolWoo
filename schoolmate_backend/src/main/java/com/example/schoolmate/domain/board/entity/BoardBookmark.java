package com.example.schoolmate.domain.board.entity;

import com.example.schoolmate.common.entity.user.User;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// [soojin] 게시글 북마크 엔티티 - 1인 1북마크, 토글(취소) 지원
@Entity
@Table(
    name = "board_bookmark",
    uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "user_id"}),
    indexes = @Index(name = "idx_board_bookmark_user", columnList = "user_id")
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardBookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime bookmarkedAt = LocalDateTime.now();
}
