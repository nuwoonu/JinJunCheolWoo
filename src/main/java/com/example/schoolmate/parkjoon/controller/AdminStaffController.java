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

import com.example.schoolmate.common.dto.StaffDTO;
import com.example.schoolmate.common.entity.info.constant.EmploymentType;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.parkjoon.service.AdminStaffService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/parkjoon/admin/staffs")
@RequiredArgsConstructor
public class AdminStaffController {

    private final AdminStaffService adminStaffService;
    private final UserRepository userRepository;

    @GetMapping
    public String list(
            @ModelAttribute StaffDTO.StaffSearchCondition condition,
            @PageableDefault(size = 10, sort = "uid", direction = Sort.Direction.DESC) Pageable pageable,
            Model model) {

        Page<StaffDTO.DetailResponse> staffPage = adminStaffService.getStaffList(condition, pageable);

        model.addAttribute("staffs", staffPage.getContent());
        model.addAttribute("page", staffPage);
        model.addAttribute("condition", condition);

        return "parkjoon/admin/staffs/main";
    }

    @GetMapping("/create")
    public String createForm(Model model) {
        model.addAttribute("departments", List.of("행정실", "시설관리실", "급식실", "전산실", "당직실", "기타"));
        model.addAttribute("employmentTypes", EmploymentType.values());
        return "parkjoon/admin/staffs/create";
    }

    @PostMapping("/create")
    public String create(@ModelAttribute StaffDTO.CreateRequest request, RedirectAttributes ra) {
        try {
            adminStaffService.createStaff(request);
            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
            return "redirect:/parkjoon/admin/staffs/" + user.getUid();
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "등록 실패: " + e.getMessage());
            return "redirect:/parkjoon/admin/staffs/create";
        }
    }

    @GetMapping("/{uid}")
    public String detail(@PathVariable Long uid, Model model) {
        StaffDTO.DetailResponse staff = adminStaffService.getStaffDetail(uid);
        model.addAttribute("staff", staff);
        model.addAttribute("statusList", StaffStatus.values());
        model.addAttribute("employmentTypes", EmploymentType.values());
        model.addAttribute("departments", List.of("행정실", "시설관리실", "급식실", "전산실", "당직실", "기타"));
        return "parkjoon/admin/staffs/detail";
    }

    @PostMapping("/update")
    public String update(@ModelAttribute StaffDTO.UpdateRequest request, RedirectAttributes ra) {
        try {
            adminStaffService.updateStaff(request);
            ra.addFlashAttribute("successMessage", "교직원 정보가 수정되었습니다.");
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "수정 실패: " + e.getMessage());
        }
        return "redirect:/parkjoon/admin/staffs/" + request.getUid();
    }

    @PostMapping("/import-csv")
    @ResponseBody
    public ResponseEntity<String> importCsv(@RequestParam("file") MultipartFile file) {
        try {
            adminStaffService.importStaffsFromCsv(file);
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
            adminStaffService.bulkUpdateStaffStatus(uids, status);
            return ResponseEntity.ok("상태가 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("오류: " + e.getMessage());
        }
    }
}
