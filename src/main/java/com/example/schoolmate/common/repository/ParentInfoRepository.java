package com.example.schoolmate.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.ParentInfo;

public interface ParentInfoRepository extends JpaRepository<ParentInfo, Long> {

}