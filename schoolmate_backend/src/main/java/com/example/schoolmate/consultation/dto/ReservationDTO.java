package com.example.schoolmate.consultation.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// [soojin] 상담 예약 DTO
public class ReservationDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    public static class CreateRequest {
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private String content;
        private Long studentInfoId; // 자녀 선택
        private String consultationType; // "VISIT" or "PHONE"
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private String writerName;
        private String content;
        private String status;
        private String studentName;
        private String studentNumber;
        private String createDate;
        private String consultationType;
    }

    // 교사 일정 조정 + 확정 요청
    @Getter
    @Setter
    @NoArgsConstructor
    public static class ConfirmRequest {
        private LocalDate date; // null이면 기존 유지
        private LocalTime startTime;
        private LocalTime endTime;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChildInfo {
        private Long id; // studentInfo.id
        private String name; // user.name
        private Integer grade;
        private Integer classNum;
        private Integer number;
    }
}
