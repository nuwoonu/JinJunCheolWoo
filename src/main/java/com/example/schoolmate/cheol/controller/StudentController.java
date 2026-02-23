package com.example.schoolmate.cheol.controller;

import java.util.List;

import java.time.LocalDate;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.common.service.StudentService;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.constant.UserRole;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Controller
@RequiredArgsConstructor
@RequestMapping("/student")
@Log4j2
public class StudentController {

    private final StudentService studentService;

    // 학생 목록 페이지
    @GetMapping("/list")
    public String getStudentList(Model model) {
        List<StudentResponseDTO> students = studentService.getAllStudents();
        model.addAttribute("students", students);
        model.addAttribute("statusList", StudentStatus.values());
        log.info("학생 list 접속");
        return "cheol/student-list";
    }

    // 로그인한 학생 본인의 상세 정보 페이지
    @GetMapping("/myinfo")
    public String getMyInfo(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();
        StudentResponseDTO student = studentService.getStudentByUid(uid);
        model.addAttribute("student", student);
        log.info("학생 본인 정보 조회: {}", uid);
        return "cheol/student-details";
    }

    // 학생 상세 페이지
    @GetMapping("/details/{id}")
    public String getStudentDetails(@PathVariable Long id, Model model) {
        StudentResponseDTO student = studentService.getStudentByUid(id);
        model.addAttribute("student", student);
        return "student/student-details";
    }

    // 학번으로 학생 상세 조회
    @GetMapping("/details/number/{studentNumber}")
    public String getStudentDetailsByNumber(@PathVariable Integer studentNumber, Model model) {
        StudentResponseDTO student = studentService.getStudentByStudentNumber(studentNumber);
        model.addAttribute("student", student);
        return "student/student-details";
    }

    // 학생 등록 폼 페이지
    // [woo 수정] 담임 교사만 접근 가능하도록 변경
    // - 교사: 담임 학급의 grade/classNum 자동 세팅 (readonly), 담임 아니면 /dashboard 리다이렉트
    // - ADMIN: grade/classNum 드롭다운 직접 선택
    // - 템플릿 경로: "student/add-new-student" → "cheol/add-new-student" (수정됨)
    // - 모델 속성명: "studentCreateDTO" → "studentDTO" (템플릿과 일치시킴)
    @GetMapping("/add")
    public String getAddStudentForm(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        StudentCreateDTO dto = new StudentCreateDTO();

        if (authUserDTO.hasRole(UserRole.TEACHER)) {
            Long uid = authUserDTO.getCustomUserDTO().getUid();
            java.util.Optional<Classroom> classroom = studentService.findHomeroomClassroom(uid);
            if (classroom.isEmpty()) {
                // 담임이 아닌 교사는 접근 불가
                log.warn("담임 미배정 교사가 학생 추가 접근 시도: uid={}", uid);
                return "redirect:/dashboard";
            }
            dto.setGrade(classroom.get().getGrade());
            dto.setClassNum(classroom.get().getClassNum());
            model.addAttribute("isTeacher", true);
        } else {
            model.addAttribute("isTeacher", false);
        }

        model.addAttribute("studentDTO", dto);
        model.addAttribute("currentYear", LocalDate.now().getYear());
        return "cheol/add-new-student";
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
        StudentResponseDTO student = studentService.getStudentByUid(id);
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
