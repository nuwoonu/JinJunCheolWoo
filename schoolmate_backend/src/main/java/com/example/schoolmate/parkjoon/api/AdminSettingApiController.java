package com.example.schoolmate.parkjoon.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.common.service.SystemSettingService;

import lombok.RequiredArgsConstructor;

// 시스템 설정 REST API
@RestController
@RequestMapping("/parkjoon/admin/api/settings")
@RequiredArgsConstructor
public class AdminSettingApiController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    public ResponseEntity<?> get() {
        return ResponseEntity.ok(systemSettingService.getCurrentSetting());
    }

    @PostMapping
    public ResponseEntity<Void> update(@RequestParam int year, @RequestParam int semester) {
        systemSettingService.updateSystemSetting(year, semester);
        return ResponseEntity.ok().build();
    }
}
