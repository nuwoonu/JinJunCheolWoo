package com.example.schoolmate.common.dto.dashboardinfo;

import java.time.LocalDate;
import java.time.LocalTime;

import com.example.schoolmate.common.entity.constant.AttendanceStatus;

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
public class StudentAttendanceDTO {

    // 출결 - (출석 / 지각 / 결석 / ...) 통계

    private Long id;

    private LocalDate attendanceDate; // 출결 날짜

    private AttendanceStatus status; // 출결 상태 (PRESENT, LATE, ABSENT...)

    private LocalTime checkInTime; // 출석 시간

    private String reason; // 사유

    // studentInfo 부분을 아예 따로 뺀건지

}
