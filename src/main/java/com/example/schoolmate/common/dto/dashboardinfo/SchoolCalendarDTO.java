package com.example.schoolmate.common.dto.dashboardinfo;

import java.time.LocalDate;

import com.example.schoolmate.soojin.entity.constant.EventType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolCalendarDTO {

    // 다가오는 학교 일정, 학교 전체 일정

    private Long id;

    private String title;

    private LocalDate startDate;

    private LocalDate endDate;

    private EventType eventType;

    // 대상 학년 (null이면 전체)
    private Integer targetGrade;

    // 이벤트 상세 설명
    private String description;

    // D-2, D-DAY 표시
    private Integer dDay;

    // 00/00(0) 표시
    private String dateRangeText;
}
