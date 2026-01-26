package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.common.service.SystemSettingService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/parkjoon/admin/master")
@RequiredArgsConstructor
public class AdminMasterController {

    private final SystemSettingService systemSettingService;

    @GetMapping("/schedule")
    public String schedule() {
        return "parkjoon/admin/master/schedule";
    }

    @GetMapping("/subjects")
    public String subjects() {
        return "parkjoon/admin/master/subjects";
    }

    @GetMapping("/settings")
    public String settings(Model model) {
        model.addAttribute("setting", systemSettingService.getCurrentSetting());
        return "parkjoon/admin/master/settings";
    }

    @PostMapping("/settings")
    public String updateSettings(@RequestParam int year, @RequestParam int semester, RedirectAttributes ra) {
        systemSettingService.updateSystemSetting(year, semester);
        ra.addFlashAttribute("successMessage", "시스템 설정이 저장되었습니다.");
        return "redirect:/parkjoon/admin/master/settings";
    }
}