package com.example.schoolmate.parkjoon.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.parkjoon.service.AdminTeacherService;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.entity.user.User;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping(SchoolmateUrls.ADMIN_TEACHERS)
@RequiredArgsConstructor
public class AdminTeacherController {

    private final AdminTeacherService adminTeacherService;
    private final UserRepository userRepository;

    @GetMapping
    public String list(
            @ModelAttribute TeacherDTO.TeacherSearchCondition condition,
            @PageableDefault(size = 10, sort = "uid", direction = Sort.Direction.DESC) Pageable pageable,
            Model model) {

        Page<TeacherDTO.DetailResponse> teacherPage = adminTeacherService.getTeacherList(condition, pageable);

        model.addAttribute("teachers", teacherPage.getContent());
        model.addAttribute("page", teacherPage);
        model.addAttribute("condition", condition);
        model.addAttribute("statuses", TeacherStatus.values());

        return SchoolmateUrls.ADMIN_TEACHERS + "/main";
    }

    @GetMapping("/create")
    public String createForm(Model model) {
        model.addAttribute("departments", List.of("교무부", "학생부", "연구부", "진로진학부", "환경부", "체육부"));
        model.addAttribute("positions", List.of("교장", "교감", "수석교사", "부장교사", "평교사", "기간제교사"));
        return SchoolmateUrls.ADMIN_TEACHERS + "/create";
    }

    @PostMapping("/create")
    public String create(@ModelAttribute TeacherDTO.CreateRequest request, RedirectAttributes ra) {
        try {
            adminTeacherService.createTeacher(request);
            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
            return "redirect:" + SchoolmateUrls.ADMIN_TEACHERS + "/" + user.getUid();
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "등록 실패: " + e.getMessage());
            return "redirect:" + SchoolmateUrls.ADMIN_TEACHERS + "/create";
        }
    }

    @GetMapping("/{uid}")
    public String detail(@PathVariable Long uid, Model model) {
        TeacherDTO.DetailResponse teacher = adminTeacherService.getTeacherDetail(uid);
        model.addAttribute("teacher", teacher);
        model.addAttribute("statusList", TeacherStatus.values());
        model.addAttribute("departments", List.of("교무부", "학생부", "연구부", "진로진학부", "환경부", "체육부"));
        model.addAttribute("positions", List.of("교장", "교감", "수석교사", "부장교사", "평교사", "기간제교사"));
        model.addAttribute("allRoles", UserRole.values()); // 권한 목록 추가
        return SchoolmateUrls.ADMIN_TEACHERS + "/detail";
    }

    @PostMapping("/update")
    public String update(@ModelAttribute TeacherDTO.UpdateRequest request, RedirectAttributes ra) {
        try {
            adminTeacherService.updateTeacher(request);
            ra.addFlashAttribute("successMessage", "교사 정보가 수정되었습니다.");
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "수정 실패: " + e.getMessage());
        }
        return "redirect:" + SchoolmateUrls.ADMIN_TEACHERS + "/" + request.getUid();
    }

    @PostMapping("/import-csv")
    @ResponseBody
    public ResponseEntity<String> importCsv(@RequestParam("file") MultipartFile file) {
        try {
            adminTeacherService.importTeachersFromCsv(file);
            return ResponseEntity.ok("성공");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("오류: " + e.getMessage());
        }
    }

    @PostMapping("/bulk-status")
    @ResponseBody
    public ResponseEntity<String> bulkStatus(@RequestParam("uids") List<Long> uids,
            @RequestParam("status") String status) {
        try {
            adminTeacherService.bulkUpdateTeacherStatus(uids, status);
            return ResponseEntity.ok("상태가 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("오류: " + e.getMessage());
        }
    }

    @PostMapping("/{uid}/add-role")
    public String addRole(@PathVariable Long uid, @RequestParam("role") String role, RedirectAttributes ra) {
        adminTeacherService.addRole(uid, role);
        ra.addFlashAttribute("successMessage", "권한이 추가되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_TEACHERS + "/" + uid + "#roles";
    }

    @PostMapping("/{uid}/remove-role")
    public String removeRole(@PathVariable Long uid, @RequestParam("role") String role, RedirectAttributes ra) {
        adminTeacherService.removeRole(uid, role);
        ra.addFlashAttribute("successMessage", "권한이 삭제되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_TEACHERS + "/" + uid + "#roles";
    }
}