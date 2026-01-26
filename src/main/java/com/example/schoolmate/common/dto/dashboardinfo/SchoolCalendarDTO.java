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

    private String eventTypeText; // "학교행사", "시험" 등 >>??

    private Integer targetGrade; // 대상 학년 (null이면 전체)

    private String description; // 상세 설명

    private Integer dDay; // 계산 필드 (D-2, D-DAY) >>?

    private String dateRangeText; // 계산 필드 ("1/23(금)") >>?
}
