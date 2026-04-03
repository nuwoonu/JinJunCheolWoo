package com.example.schoolmate.cheol.dto.volunteerActivitydto;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.user.constant.Year;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 봉사활동 등록/수정 요청 DTO (cumulativeHours는 자동 계산되므로 제외)
@Getter
@NoArgsConstructor
public class VolunteerActivityRequestDTO {
    private Long studentId;
    private Year year;
    private LocalDate startDate;
    private LocalDate endDate;
    private String organizer;
    private String activityContent;
    private Double hours;
}
