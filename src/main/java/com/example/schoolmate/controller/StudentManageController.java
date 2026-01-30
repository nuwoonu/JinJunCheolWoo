package com.example.schoolmate.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.service.StudentService;

import lombok.RequiredArgsConstructor;

/**
 * [woo 추가] 학생 정보 관리 컨트롤러 - 기존 메인 레이아웃 기반
 * parkjoon/AdminStudentController의 기능을 메인 대시보드에 통합
 */
@Controller
@RequestMapping("/admin/students")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StudentManageController {

    private final StudentService adminStudentService;

    @GetMapping
    public String studentManagement(
            StudentDTO.StudentSearchCondition condition,
            @PageableDefault(size = 10) Pageable pageable,
            Model model) {

        if (condition == null) {
            condition = new StudentDTO.StudentSearchCondition();
        }

        Page<StudentDTO.SummaryResponse> studentPage = adminStudentService.getStudentSummaryList(condition, pageable);

        model.addAttribute("students", studentPage.getContent());
        model.addAttribute("page", studentPage);
        model.addAttribute("condition", condition);
        model.addAttribute("statusList", StudentStatus.values());

        return "student/student-list"; // [woo 수정] 기존 템플릿 사용
    }

    @PostMapping("/create")
    public String createStudent(@ModelAttribute StudentDTO.CreateRequest request) {
        adminStudentService.createStudent(request);
        return "redirect:/admin/students";
    }

    @PostMapping("/update-basic")
    public String updateBasicInfo(@ModelAttribute StudentDTO.UpdateRequest request) {
        adminStudentService.updateStudentBasicInfo(request);
        return "redirect:/admin/students";
    }
}
