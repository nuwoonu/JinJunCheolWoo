package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("parkjoon/admin")
public class AdminMainController {

    /**
     * 관리자 메인 대시보드 페이지
     * 경로: /parkjoon/admin/dashboard
     */
    @GetMapping("/dashboard")
    public String dashboard() {
        // templates/parkjoon/admin/main.html 을 호출
        return "parkjoon/admin/main";
    }

    /**
     * 관리자 루트 경로로 접근 시 대시보드로 리다이렉트
     */
    @GetMapping({ "", "/" })
    public String index() {
        return "redirect:/parkjoon/admin/dashboard";
    }
}