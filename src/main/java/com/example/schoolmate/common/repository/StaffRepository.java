package com.example.schoolmate.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.Staff;

public interface StaffRepository extends JpaRepository<Staff, Long> {

}