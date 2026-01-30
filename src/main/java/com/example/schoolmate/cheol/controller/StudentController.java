package com.example.schoolmate.cheol.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.cheol.service.StudentServiceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Controller
@RequiredArgsConstructor
@RequestMapping("/student")
@Log4j2
public class StudentController {

    private final StudentServiceImpl studentService;

    // 학생 목록 페이지
    @GetMapping("/list")
    public String getStudentList(Model model) {
        List<StudentResponseDTO> students = studentService.getAllStudents();
        model.addAttribute("students", students);
        log.info("학생 list 접속");

        return "cheol/student-list";
    }

    // 로그인한 학생 본인의 상세 정보 페이지
    @GetMapping("/myinfo")
    public String getMyInfo(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {

        Long uid = authUserDTO.getCustomUserDTO().getUid();
        StudentResponseDTO student = studentService.getStudentByUserUid(uid);
        model.addAttribute("student", student);
        log.info("학생 본인 정보 조회: {}", uid);
        return "cheol/student-details";
    }

    // 학생 상세 페이지
    @GetMapping("/details/{id}")
    public String getStudentDetails(@PathVariable Long id, Model model) {
        StudentResponseDTO student = studentService.getStudentById(id);
        model.addAttribute("student", student);
        return "student/student-details";
    }

    // 학번으로 학생 상세 조회
    @GetMapping("/details/number/{studentNumber}")
    public String getStudentDetailsByNumber(@PathVariable Long studentNumber, Model model) {
        StudentResponseDTO student = studentService.getStudentByStudentNumber(studentNumber);
        model.addAttribute("student", student);
        return "student/student-details";
    }

    // 학생 등록 폼 페이지
    @GetMapping("/add")
    public String getAddStudentForm(Model model) {
        model.addAttribute("studentCreateDTO", new StudentCreateDTO());
        return "student/add-new-student";
    }

    // 학생 등록 처리
    @PostMapping("/add")
    public String createStudent(@ModelAttribute StudentCreateDTO createDTO) {
        studentService.createStudent(createDTO);
        return "redirect:/student/list";
    }

    // 학생 수정 폼 페이지
    @GetMapping("/edit/{id}")
    public String getEditStudentForm(@PathVariable Long id, Model model) {
        StudentResponseDTO student = studentService.getStudentById(id);
        model.addAttribute("student", student);
        model.addAttribute("studentUpdateDTO", new StudentUpdateDTO());
        return "cheol/edit-student";
    }

    // 학생 수정 처리
    @PostMapping("/edit/{id}")
    public String updateStudent(@PathVariable Long id, @ModelAttribute StudentUpdateDTO updateDTO) {
        studentService.updateStudent(id, updateDTO);
        return "redirect:/student/myinfo";
    }

    // 학생 삭제 (소프트 삭제 - 자퇴 처리)
    @PostMapping("/delete/{id}")
    public String deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return "redirect:/student/list";
    }

    // 학생 영구 삭제
    @PostMapping("/delete/{uid}/permanent")
    public String permanentDeleteStudent(@PathVariable Long uid) {
        studentService.permanentDeleteStudent(uid);
        return "redirect:/student/list";
    }

    // 학년별 학생 목록
    @GetMapping("/grade/{grade}")
    public String getStudentsByGrade(@PathVariable int grade, Model model) {
        List<StudentResponseDTO> students = studentService.getStudentsByGrade(grade);
        model.addAttribute("students", students);
        model.addAttribute("grade", grade);
        return "cheol/student-list";
    }

    // 반별 학생 목록
    @GetMapping("/class/{classNum}")
    public String getStudentsByClassNum(@PathVariable int classNum, Model model) {
        List<StudentResponseDTO> students = studentService.getStudentsByClassNum(classNum);
        model.addAttribute("students", students);
        model.addAttribute("classNum", classNum);
        return "cheol/student-list";
    }

    // 학년+반별 학생 목록
    @GetMapping("/grade/{grade}/class/{classNum}")
    public String getStudentsByGradeAndClass(@PathVariable int grade, @PathVariable int classNum, Model model) {
        List<StudentResponseDTO> students = studentService.getStudentsByGradeAndClass(grade, classNum);
        model.addAttribute("students", students);
        model.addAttribute("grade", grade);
        model.addAttribute("classNum", classNum);
        return "cheol/student-list";
    }

    // 학생 카테고리 페이지
    @GetMapping("/category")
    public String getStudentCategory() {
        return "student/student-category";
    }

}
