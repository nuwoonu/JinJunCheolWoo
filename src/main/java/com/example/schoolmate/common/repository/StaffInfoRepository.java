package com.example.schoolmate.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.StaffInfo;

public interface StaffInfoRepository extends JpaRepository<StaffInfo, Long> {
    boolean existsByCode(String code);
}