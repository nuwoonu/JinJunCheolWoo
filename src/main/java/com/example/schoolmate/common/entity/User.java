package com.example.schoolmate.common.entity;

import com.example.schoolmate.common.entity.constant.UserRole;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user")
@Inheritance(strategy = InheritanceType.JOINED) // 자식 테이블과 조인하는 전략
@DiscriminatorColumn(name = "dtype") // 구분을 위한 컬럼
@Getter
@Setter
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

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Profile profile;

    public void changeEmail(String email) {
        this.email = email;
    }

    public void changePassword(String password) {
        this.password = password;
    }

    public void changeName(String name) {
        this.name = name;
    }

    public void changeRole(UserRole role) {
        this.role = role;
    }

    public void changeProfile(Profile profile) {
        this.profile = profile;
    }
}
