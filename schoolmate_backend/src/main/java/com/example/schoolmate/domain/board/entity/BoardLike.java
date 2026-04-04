package com.example.schoolmate.domain.board.entity;

import com.example.schoolmate.domain.user.entity.User;

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

// [soojin] 게시글 좋아요 엔티티 - 1인 1투표, 토글(취소) 지원
@Entity
@Table(
    name = "board_like",
    uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "user_id"}),
    indexes = @Index(name = "idx_board_like_board", columnList = "board_id")
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardLike {

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
    private LocalDateTime likedAt = LocalDateTime.now();
}
