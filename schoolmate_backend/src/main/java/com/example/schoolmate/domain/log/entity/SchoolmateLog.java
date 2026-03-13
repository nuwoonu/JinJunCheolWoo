package com.example.schoolmate.domain.log.entity;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "log_type", discriminatorType = DiscriminatorType.STRING)
@Table(name = "schoolmate_log")
public abstract class SchoolmateLog extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actorName; // 작업자 (adminName / username / createdBy 통합)
    private String ipAddress; // 접속 IP (nullable)

    // createDate (생성일시)는 BaseEntity에서 상속
}
