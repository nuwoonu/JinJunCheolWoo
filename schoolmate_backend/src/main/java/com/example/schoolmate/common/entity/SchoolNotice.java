package com.example.schoolmate.common.entity;

import com.example.schoolmate.common.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolNotice extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "writer_uid")
    private User writer;

    @Builder.Default
    private int viewCount = 0;

    @Builder.Default
    private boolean isImportant = false; // 중요 공지 (상단 고정)

    public void increaseViewCount() {
        this.viewCount++;
    }
}