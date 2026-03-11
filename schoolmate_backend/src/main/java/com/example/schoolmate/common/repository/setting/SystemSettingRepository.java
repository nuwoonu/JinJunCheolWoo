package com.example.schoolmate.common.repository.setting;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.schoolmate.common.entity.SystemSetting;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
}