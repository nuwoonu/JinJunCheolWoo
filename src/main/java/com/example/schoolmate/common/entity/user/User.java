package com.example.schoolmate.common.entity.user;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.info.BaseInfo;
import com.example.schoolmate.common.entity.user.constant.UserRole;

import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_main")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long uid;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;
    private String name;
    private String phoneNumber;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "uid"))
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<UserRole> roles = new HashSet<>();

    // 새로운 핵심: 신분 정보 리스트 (1:N)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BaseInfo> infos = new ArrayList<>();

    // --- Role 관련 편의 메서드 ---
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

    // --- Info 관련 편의 메서드 ---

    /**
     * 상세 정보(Info)를 추가하며 연관 관계를 설정합니다.
     * 권한(Role)은 비즈니스 로직에 따라 별도로 관리(addRole/removeRole)해야 합니다.
     */
    public void addInfo(BaseInfo info) {
        if (info == null)
            return;

        this.infos.add(info);
        info.setUser(this); // 양방향 연관관계 설정
    }

    public <T extends BaseInfo> T getInfo(Class<T> clazz) {
        return infos.stream()
                .filter(clazz::isInstance)
                .map(clazz::cast)
                .findFirst()
                .orElse(null);
    }

    // --- 정보 변경 메서드 ---
    public void changePassword(String newPassword) {
        this.password = newPassword;
    }

    public void changeName(String newName) {
        this.name = newName;
    }
}