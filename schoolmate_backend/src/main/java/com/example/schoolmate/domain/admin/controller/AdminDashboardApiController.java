package com.example.schoolmate.domain.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.global.config.SchoolmateUrls;
import com.example.schoolmate.domain.dashboard.dto.DashboardDTO;
import com.example.schoolmate.domain.dashboard.service.DashboardService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;

// 관리자 대시보드 REST API
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_DASHBOARD)
@RequiredArgsConstructor
@PreAuthorize("@grants.canAccessAdmin()")
public class AdminDashboardApiController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardDTO> getStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }
}
