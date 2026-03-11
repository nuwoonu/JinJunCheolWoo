package com.example.schoolmate.domain.resources.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum FacilityStatus {
    AVAILABLE("사용 가능"),
    MAINTENANCE("보수/공사 중"),
    CLOSED("사용 불가/폐쇄");

    private final String description;
}