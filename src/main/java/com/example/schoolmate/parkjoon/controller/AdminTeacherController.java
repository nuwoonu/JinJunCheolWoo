package com.example.schoolmate.parkjoon.controller;

import java.util.List;

import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.parkjoon.service.AdminTeacherService;

import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Controller
@RequestMapping("parkjoon/admin/teachers")
@RequiredArgsConstructor
public class AdminTeacherController {
    private final AdminTeacherService adminTeacherService;
    private final UserRepository userRepository;

    @GetMapping
    public String list(
            @ModelAttribute TeacherDTO.TeacherSearchCondition condition, // type, keyword 자동 바인딩
            @PageableDefault(size = 10, sort = "uid", direction = Sort.Direction.DESC) Pageable pageable,
            Model model) {

        // QueryDSL을 통해 페이징 처리된 데이터 조회
        Page<TeacherDTO.DetailResponse> teacherPage = adminTeacherService.getTeacherList(condition, pageable);

        model.addAttribute("teachers", teacherPage.getContent());
        model.addAttribute("page", teacherPage);
        model.addAttribute("condition", condition); // 검색 상태 유지를 위해 전달

        return "parkjoon/admin/teachers/main";
    }

    @GetMapping("/create")
    public String createForm(Model model) {
        model.addAttribute("departments", List.of("교무부", "학생부", "연구부", "정보부", "행정실"));
        model.addAttribute("positions", List.of("평교사", "부장", "교감", "교장"));
        return "parkjoon/admin/teachers/create";
    }

    @GetMapping("/{uid}")
    public String detail(@PathVariable Long uid, Model model) {
        TeacherDTO.DetailResponse teacher = adminTeacherService.getTeacherDetail(uid);
        model.addAttribute("teacher", teacher);

        model.addAttribute("statusList", TeacherStatus.values());
        model.addAttribute("departments", List.of("교무부", "학생부", "연구부", "정보부", "행정실"));
        model.addAttribute("positions", List.of("평교사", "부장", "교감", "교장"));

        return "parkjoon/admin/teachers/detail";
    }

    @PostMapping("/create")
    public String create(@ModelAttribute TeacherDTO.CreateRequest request,
            RedirectAttributes redirectAttributes) {

        log.info("Create 교사");
        adminTeacherService.createTeacher(request);

        // 생성된 교사의 상세 페이지로 리다이렉트 (이메일로 조회)
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        return "redirect:/parkjoon/admin/teachers/" + user.getUid();
    }

    @PostMapping("/update")
    public String update(
            @ModelAttribute TeacherDTO.UpdateRequest request,
            RedirectAttributes redirectAttributes) {

        adminTeacherService.updateTeacher(request);
        return "redirect:/parkjoon/admin/teachers/" + request.getUid();
    }

    @PostMapping("/import-csv")
    @ResponseBody // AJAX 요청에 대해 성공/실패 메시지만 반환
    public ResponseEntity<String> importCsv(@RequestParam("file") MultipartFile file) {
        try {
            log.info("CSV 컨트롤러 시작");
            adminTeacherService.importTeachersFromCsv(file);
            return ResponseEntity.ok("성공");
        } catch (Exception e) {
            log.error("CSV 전달 중 치명적 에러: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("CSV 처리 중 오류 발생: " + e.getMessage());
        }
    }

    @PostMapping("/bulk-status")
    @ResponseBody
    public ResponseEntity<String> bulkUpdateStatus(@RequestParam("uids") List<Long> uids,
            @RequestParam("status") String status) {
        try {
            adminTeacherService.bulkUpdateTeacherStatus(uids, status);
            return ResponseEntity.ok("선택한 교사들의 상태가 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("상태 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

}