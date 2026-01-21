package com.example.schoolmate.common.entity.info.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StaffStatus {
    EMPLOYED("재직"),
    LEAVE("휴직"),
    RETIRED("퇴직"),
    DISPATCHED("파견"), // 교육청이나 타 기관으로 파견 나간 상태
    SUSPENDED("정직"); // 징계 등으로 업무가 정지된 상태

    private final String description;
}