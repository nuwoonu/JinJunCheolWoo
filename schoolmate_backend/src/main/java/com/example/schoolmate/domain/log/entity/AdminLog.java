package com.example.schoolmate.domain.log.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class AdminLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String adminName; // 작업자 (관리자 ID/이름)
    private String actionType; // 작업 유형 (CREATE, UPDATE, DELETE, SYNC 등)
    private String target; // 대상 (School, Student, System 등)

    @Column(columnDefinition = "TEXT")
    private String description; // 상세 내용

    private String ipAddress; // 작업자 IP (선택 사항)

    @CreatedDate
    private LocalDateTime createdAt; // 작업 일시
}
