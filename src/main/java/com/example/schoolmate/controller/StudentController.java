package com.example.schoolmate.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.service.StudentService;
import com.example.schoolmate.studentdto.StudentCreateDTO;
import com.example.schoolmate.studentdto.StudentResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/list")
    public String studentList(Model model) {
        List<StudentResponseDTO> students = studentService.getAllStudents();
        model.addAttribute("students", students);
        return "student/student-list";
    }

    @GetMapping("/add")
    public String addStudent(Model model) {
        model.addAttribute("student", new StudentCreateDTO());
        return "student/add-new-student";
    }

    @PostMapping("/add")
    public String createStudent(@Valid @ModelAttribute("student") StudentCreateDTO createDTO,
                                RedirectAttributes redirectAttributes) {
        try {
            studentService.createStudent(createDTO);
            redirectAttributes.addFlashAttribute("successMessage", "학생이 성공적으로 등록되었습니다.");
            return "redirect:/student/list";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "학생 등록 중 오류가 발생했습니다: " + e.getMessage());
            return "redirect:/student/add";
        }
    }

    @GetMapping("/edit/{uid}")
    public String editStudent(@PathVariable Long uid, Model model) {
        StudentResponseDTO student = studentService.getStudentByUid(uid);
        model.addAttribute("student", student);
        return "student/edit-student";
    }

    @GetMapping("/edit")
    public String editStudentForm() {
        return "student/edit-student";
    }

    @GetMapping("/details/{uid}")
    public String studentDetails(@PathVariable Long uid, Model model) {
        StudentResponseDTO student = studentService.getStudentByUid(uid);
        model.addAttribute("student", student);
        return "student/student-details";
    }

    @GetMapping("/details")
    public String studentDetailsForm() {
        return "student/student-details";
    }
}
