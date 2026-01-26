package com.example.schoolmate.board.entity;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.parkjoon.entity.Classroom;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "board", indexes = {
    @Index(name = "idx_board_type", columnList = "board_type"),
    @Index(name = "idx_board_type_grade", columnList = "board_type, target_grade"),
    @Index(name = "idx_board_type_classroom", columnList = "board_type, target_classroom_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Board extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "board_type", nullable = false)
    private BoardType boardType;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 5000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "writer_id", nullable = false)
    private User writer;

    // 학년 게시판, 학부모 공지/게시판 (학년별) 용
    // null이면 전체 대상
    @Column(name = "target_grade")
    private Integer targetGrade;

    // 학급 게시판, 학부모 공지/게시판 (학급별) 용
    // null이면 학년 전체 또는 전체 대상
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_classroom_id")
    private Classroom targetClassroom;

    // 조회수
    @Builder.Default
    @Column(nullable = false)
    private int viewCount = 0;

    // 상단 고정 여부
    @Builder.Default
    @Column(nullable = false)
    private boolean isPinned = false;

    // 삭제 여부 (soft delete)
    @Builder.Default
    @Column(nullable = false)
    private boolean isDeleted = false;

    // 조회수 증가
    public void incrementViewCount() {
        this.viewCount++;
    }

    // 제목 변경
    public void changeTitle(String title) {
        this.title = title;
    }

    // 내용 변경
    public void changeContent(String content) {
        this.content = content;
    }

    // 상단 고정 토글
    public void togglePinned() {
        this.isPinned = !this.isPinned;
    }

    // soft delete
    public void delete() {
        this.isDeleted = true;
    }
}
