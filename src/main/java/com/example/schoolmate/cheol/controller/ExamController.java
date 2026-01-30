package com.example.schoolmate.cheol.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.service.StudentServiceImpl;
import com.example.schoolmate.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Controller
@RequiredArgsConstructor
@RequestMapping("/exam")
@Log4j2
public class ExamController {

    private final StudentServiceImpl studentService;

    // 시험 성적 조회 페이지
    @GetMapping("")
    public String getExamPage(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();
        StudentResponseDTO student = studentService.getStudentByUserUid(uid);
        model.addAttribute("student", student);
        log.info("학생 시험 성적 페이지 접속: {}", uid);
        return "cheol/exam/exam";
    }

    // 시험 결과 페이지
    @GetMapping("/result")
    public String getExamResultPage(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();
        StudentResponseDTO student = studentService.getStudentByUserUid(uid);
        model.addAttribute("student", student);
        log.info("학생 시험 결과 페이지 접속: {}", uid);
        return "cheol/exam/exam-result";
    }

    // 시험 일정 페이지
    @GetMapping("/schedule")
    public String getExamSchedulePage(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();
        StudentResponseDTO student = studentService.getStudentByUserUid(uid);
        model.addAttribute("student", student);
        log.info("학생 시험 일정 페이지 접속: {}", uid);
        return "cheol/exam/exam-schedule";
    }
}
