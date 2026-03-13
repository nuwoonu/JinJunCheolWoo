package com.example.schoolmate.domain.log.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * 관리자 작업 이력 로그
 * - actionType: CREATE, UPDATE, DELETE, SYNC 등
 * - target: 작업 대상 (School, Student, System 등)
 * - description: 상세 내용
 * - actorName, ipAddress, createDate: SchoolmateLog 상속
 */
@Entity
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@DiscriminatorValue("ADMIN")
public class AdminLog extends SchoolmateLog {

    private String actionType; // 작업 유형 (CREATE, UPDATE, DELETE, SYNC 등)
    private String target; // 대상 (School, Student, System 등)

    @Column(columnDefinition = "TEXT")
    private String description; // 상세 내용
}
