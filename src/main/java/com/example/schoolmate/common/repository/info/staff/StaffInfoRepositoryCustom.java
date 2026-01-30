package com.example.schoolmate.common.repository.info.staff;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.common.dto.StaffDTO;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.user.User;

public interface StaffInfoRepositoryCustom {
    Page<User> search(StaffDTO.StaffSearchCondition cond, Pageable pageable);

    long countByStatus(StaffStatus status);
}