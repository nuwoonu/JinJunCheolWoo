package com.example.schoolmate.domain.attendance.entity.constant;

public enum AttendanceStatus {
    // [woo] 학생 출결 상태
    PRESENT, // 출석
    ABSENT, // 결석
    LATE, // 지각
    EARLY_LEAVE, // 조퇴
    SICK, // 병결

    // [woo] 교사 출결 상태
    LEAVE // 휴가 (교사 전용)
}
