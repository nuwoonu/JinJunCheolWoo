package com.example.schoolmate.common.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 대시보드 통계 데이터 전송 객체
 * 
 * 관리자 메인 페이지에 표시할 핵심 지표들을 담습니다.
 * - totalStudents: 재학생 수
 * - totalTeachers: 재직 교사 수
 * - pendingParents: 승인 대기 학부모 수
 */
@Getter
@Builder
public class DashboardDTO {
    private long totalStudents; // 재학생 수
    private long totalTeachers; // 재직 교사 수
    private long totalStaffs; // 재직 직원 수
    private long pendingParents; // 승인 대기 학부모 수
    private long pendingReservations; // 시설 예약 대기 (임시)
}