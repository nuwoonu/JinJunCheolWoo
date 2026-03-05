package com.example.schoolmate.board.entity;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.Classroom;
import com.querydsl.core.annotations.Generated;

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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "board_category")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardCategory extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 200)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WritePermission writePermission = WritePermission.TEACHER_ONLY; // 글쓰기 권한 교사에게만 지정

    @Builder.Default
    private Integer displayOrder = 0;

    @Builder.Default
    private boolean isDeleted = false;

    @Builder.Default
    private boolean isActive = true;

    public enum WritePermission {
        TEACHER_ONLY, ALL
    }

}
