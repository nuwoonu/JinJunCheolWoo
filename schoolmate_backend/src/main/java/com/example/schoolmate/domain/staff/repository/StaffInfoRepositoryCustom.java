package com.example.schoolmate.domain.staff.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.domain.staff.dto.StaffDTO;
import com.example.schoolmate.domain.staff.entity.constant.StaffStatus;
import com.example.schoolmate.domain.user.entity.User;

public interface StaffInfoRepositoryCustom {
    Page<User> search(StaffDTO.StaffSearchCondition cond, Pageable pageable);

    long countByStatus(StaffStatus status);
}