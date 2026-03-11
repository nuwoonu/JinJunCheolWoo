package com.example.schoolmate.domain.resources.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum FacilityType {
    CLASSROOM("일반 교실"),
    SPECIAL_ROOM("특별실(과학실, 음악실 등)"),
    COMPUTER_LAB("컴퓨터실"),
    AUDITORIUM("강당/시청각실"),
    GYM("체육관"),
    MEETING_ROOM("회의실"),
    PLAYGROUND("운동장"),
    ETC("기타");

    private final String description;
}