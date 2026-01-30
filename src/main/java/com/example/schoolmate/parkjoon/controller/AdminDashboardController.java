package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.dto.DashboardDTO;
import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.parkjoon.service.AdminDashboardService;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 대시보드 컨트롤러
 * 
 * 관리자 메인 화면(대시보드)에서 보여줄 통계 데이터와 화면을 처리합니다.
 * - 전체 학생, 교사, 직원 수 및 승인 대기 학부모 수 조회
 */
@Controller
@RequestMapping(SchoolmateUrls.ADMIN_ROOT)
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        DashboardDTO stats = adminDashboardService.getDashboardStats();
        model.addAttribute("stats", stats);
        return SchoolmateUrls.ADMIN_ROOT + "/main";
    }
}