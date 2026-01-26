package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/parkjoon/admin/master")
public class AdminMasterController {

    @GetMapping("/schedule")
    public String schedule() {
        return "parkjoon/admin/master/schedule";
    }

    @GetMapping("/subjects")
    public String subjects() {
        return "parkjoon/admin/master/subjects";
    }

    @GetMapping("/settings")
    public String settings() {
        return "parkjoon/admin/master/settings";
    }
}