package com.example.schoolmate.common.entity;

import java.util.HashSet;
import java.util.Set;

import com.example.schoolmate.common.entity.constant.UserRole;

import jakarta.persistence.Id;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Inheritance;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_main")
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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "uid"))
    @Enumerated(EnumType.STRING)
    private Set<UserRole> roles = new HashSet<>();

    public void addRole(UserRole role) {
        if (role == null)
            return;
        this.roles.add(role);
    }

    public void removeRole(UserRole role) {
        if (this.roles.size() <= 1) {
            throw new IllegalStateException("최소 하나 이상의 권한이 필요합니다.");
        }
        this.roles.remove(role);
    }

    public boolean hasRole(UserRole role) {
        return this.roles.contains(role);
    }

    public boolean isAdmin() {
        return hasRole(UserRole.ADMIN);
    }
}
