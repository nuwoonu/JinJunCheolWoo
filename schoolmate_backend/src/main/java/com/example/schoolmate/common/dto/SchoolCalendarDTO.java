package com.example.schoolmate.common.dto;

import java.time.LocalDate;

import com.example.schoolmate.soojin.entity.SchoolCalendar;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class SchoolCalendarDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        private String title;
        private LocalDate start;
        private LocalDate end;
        private String eventType; // ACADEMIC, HOLIDAY etc.
        private Integer targetGrade;
        private String description;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String title;
        private String start; // FullCalendar는 ISO String 선호
        private String end;
        private String backgroundColor; // 이벤트 색상
        private String borderColor;
        private boolean allDay;

        // 상세 정보 (Extended Props)
        private String eventType;
        private String eventTypeDesc;
        private Integer targetGrade;
        private String description;

        public static Response from(SchoolCalendar entity) {
            // 종료일이 있으면 +1일 해야 FullCalendar에서 해당일까지 포함되어 보임 (AllDay 기준)
            // 여기서는 단순 날짜 매핑만 하고 JS에서 처리하거나, 필요 시 로직 추가
            return Response.builder()
                    .id(entity.getId())
                    .title(entity.getTitle())
                    .start(entity.getStartDate().toString())
                    .end(entity.getEndDate() != null ? entity.getEndDate().plusDays(1).toString() : null) // FullCalendar
                                                                                                          // 종료일은
                                                                                                          // Exclusive
                    .allDay(true) // 학사 일정은 보통 종일 일정
                    .backgroundColor(entity.getEventType().getColor())
                    .borderColor(entity.getEventType().getColor())
                    .eventType(entity.getEventType().name())
                    .eventTypeDesc(entity.getEventType().getDescription())
                    .targetGrade(entity.getTargetGrade())
                    .description(entity.getDescription())
                    .build();
        }
    }

    /**
     * CSV 파일 일괄 등록 요청
     */
    @Getter
    @Setter
    public static class CsvImportRequest {
        @CsvBindByName(column = "일정명")
        private String title;

        @CsvBindByName(column = "시작일")
        @CsvDate("yyyy-MM-dd")
        private LocalDate start;

        @CsvBindByName(column = "종료일")
        @CsvDate("yyyy-MM-dd")
        private LocalDate end;

        @CsvBindByName(column = "유형")
        private String eventType; // ACADEMIC, HOLIDAY etc.

        @CsvBindByName(column = "대상학년")
        private Integer targetGrade;

        @CsvBindByName(column = "설명")
        private String description;
    }
}