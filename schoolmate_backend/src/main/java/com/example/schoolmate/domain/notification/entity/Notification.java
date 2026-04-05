package com.example.schoolmate.domain.notification.entity;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.user.entity.User;

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
public class Notification extends SchoolBaseEntity {
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

    private boolean isRead;    // 읽음 여부

    private boolean isDeleted; // 논리 삭제 여부

    @Column(length = 500)
    private String actionUrl;  // 클릭 시 이동할 프론트엔드 경로 (null이면 단순 읽음 처리)
}