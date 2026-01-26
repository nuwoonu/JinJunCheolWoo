package com.example.schoolmate.common.entity.info.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EmploymentType {
    PERMANENT("정규직"),
    INDEFINITE_CONTRACT("무기계약직"),
    FIXED_TERM("기간제/계약직"),
    PART_TIME("시간제/단기");

    private final String description;
}
