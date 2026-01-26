package com.example.schoolmate.soojin.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EventType {
    SCHOOL_EVENT("학교행사"), // 체육대회, 축제
    EXAM("시험"), // 중간고사, 기말고사, 모의고사
    HOLIDAY("휴일"), // 개교기념일, 공휴일
    VACATION("방학"),
    FIELD_TRIP("현장학습"), // 견학, 수학여행
    MEETING("회의"), // 교직원, 학부모 회의
    BRIEFING("설명회"), // 학부모 총회
    OTHER("기타");

    private final String description;
}
