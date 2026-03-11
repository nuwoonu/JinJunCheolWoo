package com.example.schoolmate.common.repository.info.staff;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.StaffInfo;

public interface StaffInfoRepository extends JpaRepository<StaffInfo, Long>, StaffInfoRepositoryCustom {
    boolean existsByCode(String code);
}