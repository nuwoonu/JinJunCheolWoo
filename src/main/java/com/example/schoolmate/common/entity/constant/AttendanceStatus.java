package com.example.schoolmate.common.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AttendanceStatus {
    PRESENT("출석"), // 출석
    ABSENT("결석"), // 결석
    LATE("지각"), // 지각
    EXCUSED("조퇴"), // 조퇴
    SICK("병결"); // 병결

    private final String description;
}
