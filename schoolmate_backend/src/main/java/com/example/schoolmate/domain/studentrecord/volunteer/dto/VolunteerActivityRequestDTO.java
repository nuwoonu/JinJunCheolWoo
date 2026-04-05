package com.example.schoolmate.domain.studentrecord.volunteer.dto;

import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 봉사활동 등록/수정 요청 DTO (cumulativeHours는 자동 계산되므로 제외)
@Getter
@NoArgsConstructor
public class VolunteerActivityRequestDTO {
    private Long studentId;
    private Long academicTermId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String organizer;
    private String activityContent;
    private Double hours;
}
