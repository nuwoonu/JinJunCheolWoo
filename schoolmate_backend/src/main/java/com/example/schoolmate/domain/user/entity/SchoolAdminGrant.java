package com.example.schoolmate.domain.user.entity;

import com.example.schoolmate.global.entity.BaseEntity;
import com.example.schoolmate.domain.user.entity.constant.GrantedRole;
import com.example.schoolmate.domain.school.entity.School;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 학교별 위임 관리자 권한 엔티티
 *
 * ADMIN이 특정 학교에 소속된 유저에게 제한된 관리 권한을 위임할 때 사용.
 * - user: 권한을 부여받은 유저
 * - school: 해당 권한이 유효한 학교 (학교 범위 내에서만 유효)
 * - grantedRole: 부여된 권한 종류 (GrantedRole enum)
 * - grantedBy: 권한을 부여한 ADMIN 유저
 *
 * API 요청 처리 시 JWT가 아닌 DB에서 실시간 조회하여 권한 체크.
 */
@Entity
@Table(name = "school_admin_grant",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_grant_user_school_role",
                columnNames = {"user_uid", "school_id", "granted_role"}
        ))
@Getter
@NoArgsConstructor
public class SchoolAdminGrant extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Enumerated(EnumType.STRING)
    @Column(name = "granted_role", nullable = false, columnDefinition = "varchar(50)")
    private GrantedRole grantedRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by_uid")
    private User grantedBy;

    public SchoolAdminGrant(User user, School school, GrantedRole grantedRole, User grantedBy) {
        this.user = user;
        this.school = school;
        this.grantedRole = grantedRole;
        this.grantedBy = grantedBy;
    }
}
