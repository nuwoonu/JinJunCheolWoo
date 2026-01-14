package com.example.schoolmate.parkjoon.controller;

import java.util.List;

import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.parkjoon.service.AdminTeacherService;

import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("parkjoon/admin/teachers")
@RequiredArgsConstructor
public class AdminTeacherController {
    private final AdminTeacherService adminTeacherService;

    @GetMapping
    public String teacherMainPage(
            @ModelAttribute TeacherDTO.TeacherSearchCondition condition, // type, keyword 자동 바인딩
            @PageableDefault(size = 10, sort = "uid", direction = Sort.Direction.DESC) Pageable pageable,
            Model model) {

        // QueryDSL을 통해 페이징 처리된 데이터 조회
        Page<TeacherDTO.DetailResponse> teacherPage = adminTeacherService.getTeacherList(condition, pageable);

        model.addAttribute("teachers", teacherPage.getContent());
        model.addAttribute("page", teacherPage);
        model.addAttribute("condition", condition); // 검색 상태 유지를 위해 전달

        // 공통 데이터 (부서, 직책 등)
        model.addAttribute("statusList", TeacherStatus.values());
        model.addAttribute("departments", List.of("교무부", "학생부", "연구부", "정보부", "행정실"));
        model.addAttribute("positions", List.of("평교사", "부장", "교감", "교장"));

        return "parkjoon/admin/teachers/main";
    }

    @PostMapping("/create")
    public String createTeacher(@ModelAttribute TeacherDTO.CreateRequest request) {
        adminTeacherService.createTeacher(request);
        return "redirect:/parkjoon/admin/teachers";
    }

    @PostMapping("/update")
    public String updateTeacher(@ModelAttribute TeacherDTO.UpdateRequest request) {
        adminTeacherService.updateTeacher(request);
        return "redirect:/parkjoon/admin/teachers";
    }
}