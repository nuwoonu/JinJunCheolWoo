package com.example.schoolmate.common.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.SystemSetting;
import com.example.schoolmate.common.repository.setting.SystemSettingRepository;
import com.example.schoolmate.config.school.SchoolContextHolder;

import lombok.RequiredArgsConstructor;

/**
 * 시스템 전역 설정 서비스
 *
 * 현재 학년도, 학기 등 시스템 전반에 영향을 미치는 기준 정보를 관리합니다.
 * - DB에 저장된 설정값을 조회하거나 수정하며, 값이 없을 경우 기본값을 제공합니다.
 * - X-School-Id 헤더로 전달된 학교 ID 기준으로 해당 학교의 설정을 조회합니다.
 */
@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    @Transactional(readOnly = true)
    public SystemSetting getCurrentSetting() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId != null) {
            return systemSettingRepository.findBySchoolId(schoolId)
                    .orElseGet(() -> SystemSetting.builder()
                            .currentSchoolYear(LocalDate.now().getYear())
                            .currentSemester(1)
                            .build());
        }
        return systemSettingRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> SystemSetting.builder()
                        .currentSchoolYear(LocalDate.now().getYear())
                        .currentSemester(1)
                        .build());
    }

    @Transactional
    public void updateSystemSetting(int year, int semester) {
        Long schoolId = SchoolContextHolder.getSchoolId();
        SystemSetting setting;
        if (schoolId != null) {
            setting = systemSettingRepository.findBySchoolId(schoolId)
                    .orElse(new SystemSetting());
        } else {
            setting = systemSettingRepository.findAll().stream()
                    .findFirst()
                    .orElse(new SystemSetting());
        }
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
