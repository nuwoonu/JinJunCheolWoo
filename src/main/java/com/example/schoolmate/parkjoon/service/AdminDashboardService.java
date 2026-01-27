package com.example.schoolmate.parkjoon.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.DashboardDTO;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 대시보드 서비스
 * 
 * 대시보드에 필요한 각종 통계 데이터를 DB에서 조회하여 DTO로 변환합니다.
 * - UserRepository를 통해 사용자 유형별(학생, 교사, 직원, 학부모) 상태별 카운트 조회
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;

    public DashboardDTO getDashboardStats() {
        return DashboardDTO.builder()
                .totalStudents(userRepository.countStudentsByStatus(StudentStatus.ENROLLED))
                .totalTeachers(userRepository.countTeachersByStatus(TeacherStatus.EMPLOYED))
                .totalStaffs(userRepository.countStaffsByStatus(StaffStatus.EMPLOYED))
                .pendingParents(userRepository.countParentsByStatus(ParentStatus.PENDING))
                .pendingReservations(0) // 추후 시설 예약 기능 구현 시 연동
                .build();
    }
}