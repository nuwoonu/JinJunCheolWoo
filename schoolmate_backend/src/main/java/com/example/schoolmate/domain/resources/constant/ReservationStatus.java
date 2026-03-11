package com.example.schoolmate.domain.resources.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ReservationStatus {
    // 1. 초기 단계
    WAITING("대기", "관리자의 승인을 기다리는 중입니다."),

    // 2. 관리자 결정 단계
    APPROVED("승인", "예약이 승인되었습니다. 정해진 시간에 이용 가능합니다."),
    REJECTED("반려", "예약이 거절되었습니다. 사유를 확인해주세요."),

    // 3. 실제 이용 단계 (기자재 대여 시 유용)
    IN_USE("이용 중", "현재 시설이나 기자재를 사용 중입니다."),

    // 4. 종료 단계
    RETURNED("반납 완료", "사용 및 반납이 정상적으로 완료되었습니다."),
    CANCELLED("취소", "사용자에 의해 예약이 취소되었습니다."),

    // 5. 예외 단계
    OVERDUE("연체", "반납 예정 시간이 지났으나 반납되지 않았습니다.");

    private final String label;
    private final String description;
}