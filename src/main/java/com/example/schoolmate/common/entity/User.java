package com.example.schoolmate.common.entity;

import com.example.schoolmate.common.entity.constant.UserRole;

import jakarta.persistence.Id;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import jakarta.persistence.Inheritance;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "user_main")
@Inheritance(strategy = InheritanceType.JOINED) // 자식 테이블과 조인하는 전략
@DiscriminatorColumn(name = "user_type", discriminatorType = DiscriminatorType.STRING) // 구분을 위한 컬럼
@Getter
@SuperBuilder
@NoArgsConstructor
public abstract class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long uid;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;
    private String name;

    @Enumerated(EnumType.STRING)
    private UserRole role; // ROLE_STUDENT, ROLE_TEACHER 등
}
