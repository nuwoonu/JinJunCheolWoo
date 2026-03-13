package com.example.schoolmate.domain.log.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * 사용자 접속 이력 로그
 * - userAgent: 브라우저/기기 정보
 * - type: LOGIN, LOGOUT, LOGIN_FAIL
 * - actorName(=username), ipAddress, createDate: SchoolmateLog 상속
 */
@Entity
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@DiscriminatorValue("ACCESS")
public class AccessLog extends SchoolmateLog {

    private String userAgent; // 브라우저/기기 정보

    @Enumerated(EnumType.STRING)
    private AccessType type; // 접속 유형

    public enum AccessType {
        LOGIN, LOGOUT, LOGIN_FAIL
    }
}
