package com.example.schoolmate.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.SystemSettings;

public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Long> {
}
