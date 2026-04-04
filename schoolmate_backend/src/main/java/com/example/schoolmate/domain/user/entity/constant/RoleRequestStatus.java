package com.example.schoolmate.domain.user.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 역할 신청 상태
 *
 * 회원가입 또는 역할 추가 신청 시 어드민 승인 전까지 PENDING 상태를 유지.
 * Hub 페이지에서 상태에 따라 카드 활성/비활성 표시.
 */
@Getter
@RequiredArgsConstructor
public enum RoleRequestStatus {
    PENDING("승인대기"),    // 신청 후 어드민 검토 대기 중
    ACTIVE("활성"),         // 승인 완료 → Hub에서 해당 역할 진입 가능
    REJECTED("거절"),       // 거절됨 → Hub에서 숨김, 재신청 가능
    SUSPENDED("정지");      // 어드민에 의해 비활성화 (차단/정지) → Hub에서 흐릿하게 표시

    private final String description;
}
