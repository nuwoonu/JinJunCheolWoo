package com.example.schoolmate.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.service.ClassService;

import lombok.RequiredArgsConstructor;

/**
 * [woo 추가] 학급 관리 컨트롤러 - 기존 메인 레이아웃 기반
 * parkjoon/AdminClassController의 기능을 메인 대시보드에 통합
 */
@Controller
@RequestMapping("/admin/classes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ClassController {

    private final ClassService classService;

    @GetMapping
    public String classManagement(Model model) {
        // 1. 학급 목록 변환
        List<ClassDTO.DetailResponse> classList = classService.getClassList();

        // 2. 교사 목록 변환 (담임 배정용)
        List<ClassDTO.TeacherSelectResponse> teacherList = classService.getTeacherList();

        model.addAttribute("classes", classList);
        model.addAttribute("teachers", teacherList);
        return "common/class-list";
    }

    @PostMapping("/create")
    public String createClass(@RequestParam("year") int year,
            @RequestParam("grade") int grade,
            @RequestParam("classNum") int classNum) {

        ClassDTO.CreateRequest request = new ClassDTO.CreateRequest();
        request.setYear(year);
        request.setGrade(grade);
        request.setClassNum(classNum);

        classService.createClass(request);
        return "redirect:/admin/classes";
    }

    @PostMapping("/assign")
    public String assignTeacher(@RequestParam("classroomId") Long classroomId,
            @RequestParam("teacherUid") Long teacherUid) {

        ClassDTO.UpdateRequest request = new ClassDTO.UpdateRequest();
        request.setCid(classroomId);
        request.setTeacherUid(teacherUid);

        classService.assignTeacher(request);
        return "redirect:/admin/classes";
    }
}
