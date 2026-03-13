package com.example.schoolmate.domain.log.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * 학급 변경 이력 로그
 * - classroomId: 변경된 학급 ID
 * - actionType: CREATE, UPDATE, ASSIGN, REMOVE
 * - description: 상세 내용
 * - actorName(=createdBy), createDate: SchoolmateLog 상속
 */
@Entity
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@DiscriminatorValue("CLASSROOM")
public class ClassroomHistoryLog extends SchoolmateLog {

    private Long classroomId;
    private String actionType; // CREATE, UPDATE, ASSIGN, REMOVE

    @Column(columnDefinition = "TEXT")
    private String description;
}
