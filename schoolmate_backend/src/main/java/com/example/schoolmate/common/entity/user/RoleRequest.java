package com.example.schoolmate.common.entity.user;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.constant.RoleRequestStatus;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 역할 신청 엔티티
 *
 * 회원가입 또는 Hub에서 역할 추가 신청 시 생성.
 * 어드민이 승인(ACTIVE)/거절(REJECTED)하기 전까지 PENDING 상태 유지.
 *
 * - 어드민 직접 등록: ACTIVE로 즉시 생성 (PENDING 건너뜀)
 * - 자가 신청 (회원가입/역할 추가): PENDING으로 생성
 * - REJECTED 후 재신청: 기존 레코드 status를 PENDING으로 변경 (새 레코드 생성 안 함)
 */
@Entity
@Table(name = "role_request",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_role_request_user_role",
                columnNames = {"user_uid", "role"}
        ))
@Getter
@NoArgsConstructor
public class RoleRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    /** 신청 시 선택한 학교 ID (TEACHER, STUDENT, STAFF). PARENT, ADMIN은 null */
    @Column(name = "school_id")
    private Long schoolId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleRequestStatus status = RoleRequestStatus.PENDING;

    /** 거절 사유 (REJECTED 시 어드민 입력) */
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_uid")
    private User reviewedBy;

    public RoleRequest(User user, UserRole role, Long schoolId) {
        this.user = user;
        this.role = role;
        this.schoolId = schoolId;
        this.status = RoleRequestStatus.PENDING;
    }

    /** 어드민 직접 등록 시 즉시 ACTIVE로 생성 */
    public static RoleRequest createActive(User user, UserRole role, Long schoolId, User createdBy) {
        RoleRequest req = new RoleRequest();
        req.user = user;
        req.role = role;
        req.schoolId = schoolId;
        req.status = RoleRequestStatus.ACTIVE;
        req.reviewedBy = createdBy;
        return req;
    }

    public void approve(User reviewer) {
        this.status = RoleRequestStatus.ACTIVE;
        this.reviewedBy = reviewer;
        this.rejectionReason = null;
    }

    public void reject(User reviewer, String reason) {
        this.status = RoleRequestStatus.REJECTED;
        this.reviewedBy = reviewer;
        this.rejectionReason = reason;
    }

    public void suspend(User reviewer) {
        this.status = RoleRequestStatus.SUSPENDED;
        this.reviewedBy = reviewer;
    }

    /** REJECTED 상태에서 재신청 */
    public void reapply() {
        if (this.status != RoleRequestStatus.REJECTED) {
            throw new IllegalStateException("거절된 신청만 재신청할 수 있습니다.");
        }
        this.status = RoleRequestStatus.PENDING;
        this.rejectionReason = null;
        this.reviewedBy = null;
    }
}
