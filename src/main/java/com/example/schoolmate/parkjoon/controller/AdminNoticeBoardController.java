package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/parkjoon/admin/notices")
public class AdminNoticeBoardController {

    @GetMapping
    public String list() {
        return "parkjoon/admin/notices/main";
    }
}