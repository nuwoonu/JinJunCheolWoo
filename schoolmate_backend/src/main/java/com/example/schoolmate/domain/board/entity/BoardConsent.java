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
import lombok.Setter;

// [woo] 가정통신문 회신(동의/비동의) 엔티티
@Entity
@Table(
    name = "board_consent",
    uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "user_id"}),
    indexes = @Index(name = "idx_board_consent_board", columnList = "board_id")
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // true = 동의, false = 비동의
    @Column(nullable = false)
    private boolean agreed;

    // 학부모가 남긴 메모 (선택)
    @Column(length = 500)
    private String memo;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime consentAt = LocalDateTime.now();
}
