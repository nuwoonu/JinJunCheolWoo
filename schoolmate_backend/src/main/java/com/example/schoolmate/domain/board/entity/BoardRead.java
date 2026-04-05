package com.example.schoolmate.domain.board.entity;

import java.time.LocalDateTime;

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

// [woo] 게시물 읽음 여부 추적 — 웹/앱 공통으로 동기화
@Entity
@Table(
    name = "board_read",
    uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "user_id"}),
    indexes = @Index(name = "idx_board_read_user", columnList = "user_id")
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardRead {

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
    private LocalDateTime readAt = LocalDateTime.now();
}
