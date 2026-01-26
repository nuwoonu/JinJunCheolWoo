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