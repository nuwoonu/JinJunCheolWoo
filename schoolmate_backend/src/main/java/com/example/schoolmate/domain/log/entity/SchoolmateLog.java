package com.example.schoolmate.domain.log.entity;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * 통합 로그 엔티티
 * - logType 으로 ADMIN / ACCESS / CLASSROOM 구분
 *
 * ADMIN    : actionType, target, description 사용
 * ACCESS   : userAgent, accessType(LOGIN/LOGOUT/LOGIN_FAIL) 사용
 * CLASSROOM: classroomId, actionType, description 사용
 *
 * 공통: actorName, ipAddress, createDate(BaseEntity 상속)
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "schoolmate_log")
public class SchoolmateLog extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogType logType;

    private String actorName;  // 작업자 (username / adminName 통합)
    private String ipAddress;  // 접속 IP (nullable)

    // ADMIN, CLASSROOM 공통
    private String actionType; // CREATE, UPDATE, DELETE, ASSIGN, REMOVE 등

    // ADMIN 전용
    private String target;     // 작업 대상 (School, Student, System 등)

    // ADMIN, CLASSROOM 공통
    @Column(columnDefinition = "TEXT")
    private String description;

    // ACCESS 전용
    private String userAgent;  // 브라우저/기기 정보
    private String accessType; // LOGIN, LOGOUT, LOGIN_FAIL

    // CLASSROOM 전용
    private Long classroomId;
}
