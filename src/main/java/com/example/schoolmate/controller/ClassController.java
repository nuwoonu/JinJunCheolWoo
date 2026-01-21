package com.example.schoolmate.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
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

/**
 * [woo 추가] 학급 관리 컨트롤러 - 기존 메인 레이아웃 기반
 * parkjoon/AdminClassController의 기능을 메인 대시보드에 통합
 */
@Controller
@RequestMapping("/admin/classes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ClassController {

    private final AdminClassService adminClassService;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final AdminClassMapper adminClassMapper;

    @GetMapping
    public String classManagement(Model model) {
        // 1. 학급 목록 변환
        List<AdminClassDTO.ClassInfoResponse> classList = classroomRepository.findAll().stream()
                .map(adminClassMapper::toClassInfoResponse)
                .toList();

        // 2. 교사 목록 변환 (담임 배정용)
        List<AdminClassDTO.TeacherSelectResponse> teacherList = userRepository.findAll().stream()
                .filter(u -> u.hasRole(UserRole.TEACHER))
                .map(adminClassMapper::toTeacherSelectResponse)
                .toList();

        model.addAttribute("classes", classList);
        model.addAttribute("teachers", teacherList);
        return "common/class-list";  // [woo 수정] 기존 템플릿 사용
    }

    @PostMapping("/create")
    public String createClass(@RequestParam int year,
                              @RequestParam int grade,
                              @RequestParam int classNum) {
        adminClassService.createClassroom(year, grade, classNum);
        return "redirect:/admin/classes";
    }

    @PostMapping("/assign")
    public String assignTeacher(@RequestParam Long classroomId,
                                @RequestParam Long teacherUid) {
        adminClassService.assignTeacher(classroomId, teacherUid);
        return "redirect:/admin/classes";
    }
}
