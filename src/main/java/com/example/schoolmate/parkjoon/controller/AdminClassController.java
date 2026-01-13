package com.example.schoolmate.parkjoon.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.parkjoon.dto.AdminClassDTO;
import com.example.schoolmate.parkjoon.mapper.AdminClassMapper;
import com.example.schoolmate.parkjoon.repository.ClassroomRepository;
import com.example.schoolmate.parkjoon.service.AdminClassService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("parkjoon/admin/classes")
@RequiredArgsConstructor
public class AdminClassController {

    private final AdminClassService adminClassService;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final AdminClassMapper adminClassMapper; // Mapper 주입

    @GetMapping
    public String mainPage(Model model) {
        // 1. 학급 목록 변환
        List<AdminClassDTO.ClassInfoResponse> classList = classroomRepository.findAll().stream()
                .map(adminClassMapper::toClassInfoResponse)
                .toList();

        // 2. 교사 목록 변환
        List<AdminClassDTO.TeacherSelectResponse> teacherList = userRepository.findAll().stream()
                .filter(u -> u.hasRole(UserRole.TEACHER))
                .map(adminClassMapper::toTeacherSelectResponse)
                .toList();

        model.addAttribute("classes", classList);
        model.addAttribute("teachers", teacherList);
        return "parkjoon/admin/main";
    }

    @PostMapping("/assign")
    public String assignTeacher(@RequestParam Long classroomId, @RequestParam Long teacherUid) {
        adminClassService.assignTeacher(classroomId, teacherUid);
        return "redirect:/parkjoon/admin/classes";
    }

    @PostMapping("/create")
    public String createClass(@RequestParam int year, @RequestParam int grade, @RequestParam int classNum) {
        adminClassService.createClassroom(year, grade, classNum);
        return "redirect:/parkjoon/admin/classes";
    }
}