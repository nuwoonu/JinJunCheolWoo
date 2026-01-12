package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.schoolmate.common.repository.TeacherRepository;
import com.example.schoolmate.parkjoon.repository.ClassroomRepository;
import com.example.schoolmate.parkjoon.service.AdminClassService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("parkjoon/admin/classes")
@RequiredArgsConstructor
public class AdminClassController {

    private final AdminClassService adminClassService;
    private final ClassroomRepository classroomRepository;
    private final TeacherRepository teacherRepository;

    @GetMapping
    public String mainPage(Model model) {
        // 1. 전체 학급 목록 조회
        model.addAttribute("classes", classroomRepository.findAll());
        // 2. 배정 가능한 교사 목록 조회 (dtype='TEACHER'인 유저들)
        model.addAttribute("teachers", teacherRepository.findAll());
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