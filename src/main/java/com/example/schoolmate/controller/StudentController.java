package com.example.schoolmate.controller;

import com.example.schoolmate.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.common.dto.StudentDTO;

import java.time.Year;

@Controller
@RequestMapping("/student")
@RequiredArgsConstructor
@Log4j2
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/list")
    public String studentList(Model model) {
        model.addAttribute("students", studentService.getAllStudents());
        return "student/student-list";
    }

    @GetMapping("/add")
    public String addStudent(Model model) {
        model.addAttribute("studentDTO", new StudentDTO());
        model.addAttribute("currentYear", Year.now().getValue());
        return "student/add-new-student";
    }

    // TODO: 학생 등록 기능은 새 구조에 맞는 서비스 구현 후 활성화
    @PostMapping("/add")
    public String addStudentPost(@Valid @ModelAttribute("studentDTO") StudentDTO studentDTO,
            BindingResult bindingResult,
            RedirectAttributes redirectAttributes,
            Model model) {
        log.info("학생 등록 요청: {}", studentDTO);

        if (bindingResult.hasErrors()) {
            log.info("유효성 검사 오류: {}", bindingResult.getAllErrors());
            model.addAttribute("currentYear", Year.now().getValue());
            return "student/add-new-student";
        }

        // 임시: 학생 등록 기능 비활성화 (UserService 재구현 필요)
        redirectAttributes.addFlashAttribute("error", "학생 등록 기능은 현재 준비 중입니다.");
        return "redirect:/student/add";
    }

    @GetMapping("/edit")
    public String editStudent() {
        return "student/edit-student";
    }

    @GetMapping("/details")
    public String studentDetails() {
        return "student/student-details";
    }
}
