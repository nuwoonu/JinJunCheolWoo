package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/parkjoon/admin/audit")
public class AdminAuditController {

    @GetMapping("/access")
    public String accessLogs() {
        return "parkjoon/admin/audit/access";
    }

    @GetMapping("/changes")
    public String changeLogs() {
        return "parkjoon/admin/audit/changes";
    }
}