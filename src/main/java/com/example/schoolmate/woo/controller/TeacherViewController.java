package com.example.schoolmate.woo.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.woo.dto.ClassStudentDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 교사 전용 뷰 컨트롤러
 * - 나의 학급 관련 페이지 렌더링
 * - 선생님 목록 조회
 */
@Controller
@RequestMapping("/teacher")
@RequiredArgsConstructor
@Log4j2
public class TeacherViewController {

    private final TeacherInfoRepository teacherInfoRepository;
    private final TeacherService teacherService;

    /**
     * 선생님 목록 페이지 (TEACHER, ADMIN 모두 접근 가능)
     */
    @GetMapping("/list")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String teacherList(
            @ModelAttribute TeacherDTO.TeacherSearchCondition condition,
            @PageableDefault(size = 10, sort = "uid", direction = Sort.Direction.DESC) Pageable pageable,
            Model model) {

        Page<TeacherDTO.DetailResponse> teacherPage = teacherService.getTeacherList(condition, pageable);

        model.addAttribute("teachers", teacherPage.getContent());
        model.addAttribute("page", teacherPage);
        model.addAttribute("condition", condition);
        model.addAttribute("statusList", TeacherStatus.values());
        model.addAttribute("departments", List.of("교무부", "학생부", "연구부", "정보부", "행정실"));
        model.addAttribute("positions", List.of("평교사", "부장", "교감", "교장"));

        return "teacher/teacher-list";
    }

    /**
     * 학급 현황 페이지
     */
    @GetMapping("/myclass")
    public String myClassPage(Model model, @AuthenticationPrincipal AuthUserDTO authUser) {
        Long teacherId = getTeacherId(authUser);
        int year = LocalDate.now().getYear();

        try {
            ClassStudentDTO classInfo = teacherService.getMyClassStudents(teacherId, year);
            model.addAttribute("classInfo", classInfo);
        } catch (IllegalArgumentException e) {
            log.warn("담당 학급 없음: {}", e.getMessage());
            model.addAttribute("classInfo", null);
            model.addAttribute("errorMessage", "담당 학급이 없습니다.");
        }

        return "teacher/myclass/index";
    }

    /**
     * 학생 관리 페이지
     */
    @GetMapping("/myclass/students")
    public String studentsPage(Model model, @AuthenticationPrincipal AuthUserDTO authUser) {
        Long teacherId = getTeacherId(authUser);
        int year = LocalDate.now().getYear();

        try {
            ClassStudentDTO classInfo = teacherService.getMyClassStudents(teacherId, year);
            model.addAttribute("classInfo", classInfo);
        } catch (IllegalArgumentException e) {
            log.warn("담당 학급 없음: {}", e.getMessage());
            model.addAttribute("classInfo", null);
            model.addAttribute("errorMessage", "담당 학급이 없습니다.");
        }

        return "teacher/myclass/students";
    }

    /**
     * AuthUserDTO에서 교사 ID 추출
     */
    private Long getTeacherId(AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        return teacherInfo.getId();
    }
}
