package com.example.schoolmate.common.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardDTO {
    private long totalStudents; // 재학생 수
    private long totalTeachers; // 재직 교사 수
    private long totalStaffs; // 재직 직원 수
    private long pendingParents; // 승인 대기 학부모 수
    private long pendingReservations; // 시설 예약 대기 (임시)
}