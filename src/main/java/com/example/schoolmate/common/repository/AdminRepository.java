package com.example.schoolmate.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.Admin;

public interface AdminRepository extends JpaRepository<Admin, Long> {

}