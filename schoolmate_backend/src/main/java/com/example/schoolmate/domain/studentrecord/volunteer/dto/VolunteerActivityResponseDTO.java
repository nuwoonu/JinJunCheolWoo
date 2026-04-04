package com.example.schoolmate.domain.studentrecord.volunteer.dto;

import java.time.LocalDate;

import com.example.schoolmate.domain.studentrecord.volunteer.entity.VolunteerActivity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 봉사활동 응답 DTO (cumulativeHours는 자동 계산된 누계시간 포함)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolunteerActivityResponseDTO {
    private Long id;
    private Long studentId;
    private int schoolYear;
    private int semester;
    private LocalDate startDate;
    private LocalDate endDate;
    private String organizer;
    private String activityContent;
    private Double hours;
    private Double cumulativeHours; // 자동 계산된 누계시간

    public static VolunteerActivityResponseDTO from(VolunteerActivity v) {
        return VolunteerActivityResponseDTO.builder()
                .id(v.getId())
                .studentId(v.getStudentInfo() != null ? v.getStudentInfo().getId() : null)
                .schoolYear(v.getSchoolYearInt())
                .semester(v.getSemester())
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .organizer(v.getOrganizer())
                .activityContent(v.getActivityContent())
                .hours(v.getHours())
                .cumulativeHours(v.getCumulativeHours())
                .build();
    }
}
