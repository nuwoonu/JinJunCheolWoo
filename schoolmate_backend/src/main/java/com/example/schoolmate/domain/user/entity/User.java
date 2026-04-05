package com.example.schoolmate.domain.user.entity;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.example.schoolmate.global.entity.BaseEntity;
import com.example.schoolmate.global.entity.BaseInfo;
import com.example.schoolmate.global.entity.SchoolMemberInfo;
import com.example.schoolmate.domain.user.entity.constant.UserRole;

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
import lombok.ToString;

@Entity
@Table(name = "user_main")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"infos", "socialAccounts"})
public class User extends BaseEntity {

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
    @Builder.Default
    private Set<UserRole> roles = new HashSet<>();

    // 신분 정보 리스트 (1:N)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BaseInfo> infos = new ArrayList<>();

    // 소셜 계정 연동 목록 (1:N)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserSocialAccount> socialAccounts = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;

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
     */
    public void addInfo(BaseInfo info) {
        if (info == null)
            return;
        this.infos.add(info);
        info.setUser(this);
    }

    public <T extends BaseInfo> T getInfo(Class<T> clazz) {
        return infos.stream()
                .filter(clazz::isInstance)
                .map(clazz::cast)
                .findFirst()
                .orElse(null);
    }

    /**
     * 해당 타입의 primary 인스턴스를 반환합니다.
     */
    public <T extends SchoolMemberInfo> T getPrimaryInfo(Class<T> clazz) {
        List<T> matched = infos.stream()
                .filter(clazz::isInstance)
                .map(clazz::cast)
                .collect(Collectors.toList());
        return matched.stream()
                .filter(SchoolMemberInfo::isPrimary)
                .findFirst()
                .orElse(matched.isEmpty() ? null : matched.get(0));
    }

    /**
     * 특정 학교에 소속된 info를 반환합니다.
     * schoolId가 null이면 primary info로 폴백합니다.
     */
    public <T extends SchoolMemberInfo> T getInfoForSchool(Class<T> clazz, Long schoolId) {
        if (schoolId == null) {
            return getPrimaryInfo(clazz);
        }
        return infos.stream()
                .filter(clazz::isInstance)
                .map(clazz::cast)
                .filter(info -> info.getSchool() != null && schoolId.equals(info.getSchool().getId()))
                .findFirst()
                .orElse(getPrimaryInfo(clazz));
    }

    // --- 소셜 계정 관련 편의 메서드 ---

    /** 비밀번호가 설정되어 있는지 (이메일 로그인 가능 여부) */
    public boolean hasPassword() {
        return this.password != null && !this.password.isEmpty();
    }

    // --- 정보 변경 메서드 ---
    public void changePassword(String newPassword) {
        this.password = newPassword;
    }

    public void changeName(String newName) {
        this.name = newName;
    }

    public void withdraw() {
        this.deleted = true;
    }
}
