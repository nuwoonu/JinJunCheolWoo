package com.example.schoolmate.parkjoon.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.parkjoon.mapper.AdminTeacherMapper;
import com.example.schoolmate.parkjoon.service.AdminTeacherService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("parkjoon/admin/teachers")
@RequiredArgsConstructor
public class AdminTeacherController {

    private final UserRepository userRepository;
    private final AdminTeacherMapper adminTeacherMapper;
    private final AdminTeacherService adminTeacherService;

    @GetMapping
    public String teacherMainPage(Model model) {
        // 1. 교사 권한을 가진 유저 목록 조회 및 DTO 변환
        List<TeacherDTO.DetailResponse> teacherList = userRepository.findAll().stream()
                .filter(u -> u.hasRole(UserRole.TEACHER))
                .map(adminTeacherMapper::toDetailResponse)
                .toList();

        model.addAttribute("teachers", teacherList);

        // 2. 화면의 셀렉트박스 등을 위한 공통 데이터 전달
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
}