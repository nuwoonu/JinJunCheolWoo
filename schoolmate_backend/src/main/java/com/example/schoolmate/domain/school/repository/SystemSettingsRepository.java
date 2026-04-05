package com.example.schoolmate.domain.school.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.school.entity.SystemSettings;

public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Long> {
}
