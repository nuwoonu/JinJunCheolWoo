package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.cheol.dto.SubjectDTO;
import com.example.schoolmate.common.service.SystemSettingService;
import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.parkjoon.service.AdminSubjectService;
import com.example.schoolmate.soojin.entity.constant.EventType;

import lombok.RequiredArgsConstructor;

/**
 * 시스템 기준 정보 관리 컨트롤러
 * 
 * 학교 운영에 필요한 기준 정보(Master Data)를 관리합니다.
 * - 학년도/학기 설정 (SystemSetting)
 * - 학사 일정 및 교과목 코드 관리 페이지 연결
 */
@Controller
@RequestMapping(SchoolmateUrls.ADMIN_MASTER)
@RequiredArgsConstructor
public class AdminMasterController {

    private final SystemSettingService systemSettingService;
    private final AdminSubjectService adminSubjectService;

    @GetMapping("/schedule")
    public String schedule(Model model) {
        model.addAttribute("eventTypes", EventType.values());
        return SchoolmateUrls.ADMIN_MASTER + "/schedule";
    }

    // 교과목 관리 페이지
    @GetMapping("/subjects")
    public String subjects(Model model) {
        model.addAttribute("subjects", adminSubjectService.getAllSubjects());
        return SchoolmateUrls.ADMIN_MASTER + "/subjects";
    }

    @PostMapping("/subjects/create")
    public String createSubject(SubjectDTO.Request request, RedirectAttributes ra) {
        adminSubjectService.createSubject(request);
        ra.addFlashAttribute("successMessage", "과목이 등록되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_MASTER + "/subjects";
    }

    @PostMapping("/subjects/update")
    public String updateSubject(SubjectDTO.Request request, RedirectAttributes ra) {
        adminSubjectService.updateSubject(request);
        ra.addFlashAttribute("successMessage", "과목 정보가 수정되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_MASTER + "/subjects";
    }

    @PostMapping("/subjects/delete")
    public String deleteSubject(@RequestParam("code") String code, RedirectAttributes ra) {
        adminSubjectService.deleteSubject(code);
        ra.addFlashAttribute("successMessage", "과목이 삭제되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_MASTER + "/subjects";
    }

    @GetMapping("/settings")
    public String settings(Model model) {
        model.addAttribute("setting", systemSettingService.getCurrentSetting());
        return SchoolmateUrls.ADMIN_MASTER + "/settings";
    }

    @PostMapping("/settings")
    public String updateSettings(@RequestParam("year") int year, @RequestParam("semester") int semester,
            RedirectAttributes ra) {
        systemSettingService.updateSystemSetting(year, semester);
        ra.addFlashAttribute("successMessage", "시스템 설정이 저장되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_MASTER + "/settings";
    }
}