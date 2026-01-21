package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/parkjoon/admin/")
public class AdminAuthController {

    @GetMapping("/login")
    public String adminLoginPage() {
        return "parkjoon/admin/auth/login";
    }
}
