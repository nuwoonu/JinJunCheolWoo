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
public class AccessLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;    // 사용자 ID
    private String ipAddress;   // 접속 IP
    private String userAgent;   // 브라우저/기기 정보
    
    @Enumerated(EnumType.STRING)
    private AccessType type;    // LOGIN, LOGOUT, FAIL

    @CreatedDate
    private LocalDateTime createdAt; // 발생 일시

    public enum AccessType {
        LOGIN, LOGOUT, LOGIN_FAIL
    }
}
