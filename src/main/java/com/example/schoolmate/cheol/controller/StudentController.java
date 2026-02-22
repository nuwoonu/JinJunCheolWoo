package com.example.schoolmate.cheol.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.cheol.service.StudentServiceImpl;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
@RequestMapping("/student")
public class StudentController {

    private final StudentServiceImpl studentService;

    // 학생 목록 페이지
    @GetMapping("/list")
    public String getStudentList(Model model) {
        List<StudentResponseDTO> students = studentService.getAllStudents();
        model.addAttribute("students", students);
        // [woo] 수정 사이드바의 상태 선택 드롭다운용
        model.addAttribute("statusList", StudentStatus.values());
        return "student/student-list";
    }

    // 학생 상세 페이지
    @GetMapping("/details/{uid}")
    public String getStudentDetails(@PathVariable Long uid, Model model) {
        StudentResponseDTO student = studentService.getStudentByUid(uid);
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
    @GetMapping("/edit/{uid}")
    public String getEditStudentForm(@PathVariable Long uid, Model model) {
        StudentResponseDTO student = studentService.getStudentByUid(uid);
        model.addAttribute("student", student);
        model.addAttribute("studentUpdateDTO", new StudentUpdateDTO());
        return "student/edit-student";
    }

    // 학생 수정 처리
    @PostMapping("/edit/{uid}")
    public String updateStudent(@PathVariable Long uid, @ModelAttribute StudentUpdateDTO updateDTO) {
        studentService.updateStudent(uid, updateDTO);
        return "redirect:/student/details/" + uid;
    }

    // 학생 삭제 (소프트 삭제 - 자퇴 처리)
    @PostMapping("/delete/{uid}")
    public String deleteStudent(@PathVariable Long uid) {
        studentService.deleteStudent(uid);
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
        return "student/student-list";
    }

    // 반별 학생 목록
    @GetMapping("/class/{classNum}")
    public String getStudentsByClassNum(@PathVariable int classNum, Model model) {
        List<StudentResponseDTO> students = studentService.getStudentsByClassNum(classNum);
        model.addAttribute("students", students);
        model.addAttribute("classNum", classNum);
        return "student/student-list";
    }

    // 학년+반별 학생 목록
    @GetMapping("/grade/{grade}/class/{classNum}")
    public String getStudentsByGradeAndClass(@PathVariable int grade, @PathVariable int classNum, Model model) {
        List<StudentResponseDTO> students = studentService.getStudentsByGradeAndClass(grade, classNum);
        model.addAttribute("students", students);
        model.addAttribute("grade", grade);
        model.addAttribute("classNum", classNum);
        return "student/student-list";
    }

    // 학생 카테고리 페이지
    @GetMapping("/category")
    public String getStudentCategory() {
        return "student/student-category";
    }
}
