package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.config.SchoolmateUrls;

/**
 * 관리자 인증 컨트롤러
 * 
 * 관리자 전용 로그인 페이지 등 인증 관련 뷰를 처리합니다.
 */
@Controller
@RequestMapping(SchoolmateUrls.ADMIN_ROOT)
public class AdminAuthController {

    @GetMapping("/login")
    public String adminLoginPage() {
        return SchoolmateUrls.ADMIN_ROOT + "/auth/login";
    }
}
