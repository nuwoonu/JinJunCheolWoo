package com.example.schoolmate.parkjoon.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.dto.DashboardDTO;
import com.example.schoolmate.common.service.DashboardService;

import lombok.RequiredArgsConstructor;

// 관리자 대시보드 REST API
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_DASHBOARD)
@RequiredArgsConstructor
public class AdminDashboardApiController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardDTO> getStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }
}
