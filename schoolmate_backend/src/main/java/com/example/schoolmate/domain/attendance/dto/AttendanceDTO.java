package com.example.schoolmate.domain.attendance.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

import com.example.schoolmate.domain.attendance.entity.constant.AttendanceStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// [woo] 출결 관리 DTO 모음
public class AttendanceDTO {

    // [woo] 학생 출결 응답 (프론트 AttendanceRecord 인터페이스 매칭)
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendanceResponse {
        private Long id;
        private Long studentInfoId; // [woo] 학생 정보 ID (출결 생성/수정 시 사용)
        private String studentName;
        private String studentNumber;
        private int year;       // 학년
        private int classNum;   // 반
        private String date;    // yyyy-MM-dd
        private String status;  // AttendanceStatus name ("NONE"=미처리)
        private String statusDesc;
        private String reason;
    }

    // [woo] 교사 출결 응답 (프론트 TeacherAttendanceRecord 인터페이스 매칭)
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherAttendanceResponse {
        private Long id;
        private String teacherName;
        private String teacherCode;
        private String department;
        private String date;
        private String status;
        private String statusDesc;
        private String reason;
    }

    // [woo] 출결 상태 변경 요청
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status;
        private String reason;
    }

    // [woo] 학부모용 자녀 출결 요약 응답
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChildAttendanceSummary {
        private String childName;
        private Long studentInfoId;
        private String studentNumber;
        private int grade;
        private int classNum;
        private Map<String, Long> statusCounts; // PRESENT: 20, ABSENT: 1 ...
        private int totalDays;
    }

    // [woo] 학부모용 자녀 출결 상세 기록
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChildAttendanceRecord {
        private Long id;
        private LocalDate attendanceDate;
        private String status;
        private String statusDesc;
        private LocalTime checkInTime;
        private String reason;
    }

    // [woo] 상태 한글 변환 유틸
    public static String getStatusDesc(AttendanceStatus status) {
        return switch (status) {
            case PRESENT -> "출석";
            case ABSENT -> "결석";
            case LATE -> "지각";
            case EARLY_LEAVE -> "조퇴";
            case SICK -> "병결";
            case LEAVE -> "휴가";
        };
    }
}
