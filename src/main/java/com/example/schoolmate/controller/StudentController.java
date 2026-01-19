package com.example.schoolmate.controller;

import com.example.schoolmate.common.entity.constant.UserRole;
import com.example.schoolmate.dto.CustomUserDTO;
import com.example.schoolmate.dto.StudentDTO;
import com.example.schoolmate.service.StudentService;
import com.example.schoolmate.service.UserService;
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

import java.time.Year;

@Controller
@RequestMapping("/student")
@RequiredArgsConstructor
@Log4j2
public class StudentController {

    private final StudentService studentService;
    private final UserService userService;

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

        try {
            // StudentDTO -> CustomUserDTO 변환 후 UserService.join() 사용
            CustomUserDTO userDTO = CustomUserDTO.builder()
                    .email(studentDTO.getEmail())
                    .password(studentDTO.getPassword())
                    .name(studentDTO.getName())
                    .role(UserRole.STUDENT)
                    .studentNumber(studentDTO.getStudentNumber())
                    .grade(studentDTO.getGrade())
                    .classNum(studentDTO.getClassNum())
                    .build();

            Long studentId = userService.join(userDTO);
            log.info("학생 등록 성공: ID = {}", studentId);
            redirectAttributes.addFlashAttribute("msg", "학생이 성공적으로 등록되었습니다.");
            return "redirect:/student/list";
        } catch (IllegalStateException e) {
            log.error("학생 등록 실패: {}", e.getMessage());
            model.addAttribute("error", e.getMessage());
            model.addAttribute("currentYear", Year.now().getValue());
            return "student/add-new-student";
        }
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
