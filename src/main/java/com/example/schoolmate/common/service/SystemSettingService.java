package com.example.schoolmate.common.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.SystemSetting;
import com.example.schoolmate.common.repository.SystemSettingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    @Transactional(readOnly = true)
    public SystemSetting getCurrentSetting() {
        return systemSettingRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> SystemSetting.builder()
                        .currentSchoolYear(LocalDate.now().getYear())
                        .currentSemester(1)
                        .build());
    }

    @Transactional
    public void updateSystemSetting(int year, int semester) {
        SystemSetting setting = systemSettingRepository.findAll().stream()
                .findFirst()
                .orElse(new SystemSetting());

        setting.setCurrentSchoolYear(year);
        setting.setCurrentSemester(semester);
        systemSettingRepository.save(setting);
    }

    public int getCurrentSchoolYear() {
        return getCurrentSetting().getCurrentSchoolYear();
    }

    public int getCurrentSemester() {
        return getCurrentSetting().getCurrentSemester();
    }
}