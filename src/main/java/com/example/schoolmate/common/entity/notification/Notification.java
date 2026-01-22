package com.example.schoolmate.common.entity.notification;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Notification extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    private User sender; // 발신자 (관리자, 교사)

    @ManyToOne(fetch = FetchType.LAZY)
    private User receiver; // 수신자 (학부모, 학생)

    private boolean isRead; // 읽음 여부
}