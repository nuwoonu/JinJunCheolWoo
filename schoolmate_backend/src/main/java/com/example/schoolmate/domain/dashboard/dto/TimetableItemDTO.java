package com.example.schoolmate.domain.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

// [woo] NEIS 시간표 항목 DTO
@Getter
@AllArgsConstructor
public class TimetableItemDTO {
    private Integer period;
    private String subject;
}
