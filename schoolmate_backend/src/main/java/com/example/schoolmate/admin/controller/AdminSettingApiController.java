package com.example.schoolmate.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.service.SystemSettingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;

// 시스템 설정 REST API
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_SETTINGS)
@RequiredArgsConstructor
@PreAuthorize("@grants.isSuperAdmin()")
public class AdminSettingApiController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    public ResponseEntity<?> get() {
        return ResponseEntity.ok(systemSettingService.getCurrentSetting());
    }

    @PostMapping
    public ResponseEntity<Void> update(@RequestParam int year, @RequestParam int semester) {
        log.info("시스템 설정 변경: year={}, semester={}", year, semester);
        systemSettingService.updateSystemSetting(year, semester);
        return ResponseEntity.ok().build();
    }
}
