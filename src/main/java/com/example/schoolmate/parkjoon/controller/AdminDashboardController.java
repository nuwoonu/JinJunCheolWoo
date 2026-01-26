package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.dto.DashboardDTO;
import com.example.schoolmate.parkjoon.service.AdminDashboardService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/parkjoon/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        DashboardDTO stats = adminDashboardService.getDashboardStats();
        model.addAttribute("stats", stats);
        return "parkjoon/admin/main";
    }
}