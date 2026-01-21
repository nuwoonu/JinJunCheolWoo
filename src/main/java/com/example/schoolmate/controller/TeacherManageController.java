package com.example.schoolmate.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.parkjoon.service.AdminTeacherService;

import lombok.RequiredArgsConstructor;

/**
 * [woo 추가] 교사 정보 관리 컨트롤러 - 기존 메인 레이아웃 기반
 * parkjoon/AdminTeacherController의 기능을 메인 대시보드에 통합
 */
@Controller
@RequestMapping("/admin/teachers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class TeacherManageController {

    private final AdminTeacherService adminTeacherService;

    @GetMapping
    public String teacherManagement(
            @ModelAttribute TeacherDTO.TeacherSearchCondition condition,
            @PageableDefault(size = 10, sort = "uid", direction = Sort.Direction.DESC) Pageable pageable,
            Model model) {

        Page<TeacherDTO.DetailResponse> teacherPage = adminTeacherService.getTeacherList(condition, pageable);

        model.addAttribute("teachers", teacherPage.getContent());
        model.addAttribute("page", teacherPage);
        model.addAttribute("condition", condition);
        model.addAttribute("statusList", TeacherStatus.values());
        model.addAttribute("departments", List.of("교무부", "학생부", "연구부", "정보부", "행정실"));
        model.addAttribute("positions", List.of("평교사", "부장", "교감", "교장"));

        return "teacher/teacher-list";  // [woo 수정] 기존 템플릿 사용
    }

    @PostMapping("/create")
    public String createTeacher(@ModelAttribute TeacherDTO.CreateRequest request) {
        adminTeacherService.createTeacher(request);
        return "redirect:/admin/teachers";
    }

    @PostMapping("/update")
    public String updateTeacher(@ModelAttribute TeacherDTO.UpdateRequest request) {
        adminTeacherService.updateTeacher(request);
        return "redirect:/admin/teachers";
    }
}
