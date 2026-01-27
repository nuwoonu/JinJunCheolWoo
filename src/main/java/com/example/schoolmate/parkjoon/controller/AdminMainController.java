package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 관리자 메인 라우팅 컨트롤러
 * 
 * 관리자 페이지의 진입점(/parkjoon/admin) 접근 시 대시보드로 리다이렉트합니다.
 */
@Controller
@RequestMapping("parkjoon/admin")
public class AdminMainController {

    /**
     * 관리자 루트 경로로 접근 시 대시보드로 리다이렉트
     */
    @GetMapping({ "", "/" })
    public String index() {
        return "redirect:/parkjoon/admin/dashboard";
    }
}