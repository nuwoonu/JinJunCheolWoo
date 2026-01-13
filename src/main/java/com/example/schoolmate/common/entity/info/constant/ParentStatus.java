package com.example.schoolmate.common.entity.info.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ParentStatus {
    ACTIVE("연결됨"), // 학생과 정상 연결 및 서비스 이용 중
    INACTIVE("비활성"), // 계정은 있으나 현재 돌보는 학생이 졸업/퇴학함
    PENDING("승인대기"), // 가입 후 학교 측의 확인을 기다리는 상태
    BLOCKED("차단"); // 악성 민원 등의 사유로 접근이 제한된 상태

    private final String description;
}