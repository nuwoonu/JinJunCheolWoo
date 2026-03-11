package com.example.schoolmate.common.dto.dashboardinfo;

import lombok.AllArgsConstructor;
import lombok.Getter;

// [woo] NEIS 시간표 항목 DTO
@Getter
@AllArgsConstructor
public class TimetableItemDTO {
    private Integer period;
    private String subject;
}
