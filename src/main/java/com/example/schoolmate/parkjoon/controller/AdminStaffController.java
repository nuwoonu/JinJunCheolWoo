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
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.service.StaffService;
import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.entity.user.User;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 교직원 관리 컨트롤러
 * 
 * 교직원 정보의 등록, 조회, 수정, 상태 변경을 처리합니다.
 * - 부서, 직함, 고용 형태별 교직원 목록 조회
 * - 신규 교직원 등록 및 상세 정보 관리
 */
@Controller
@RequestMapping(SchoolmateUrls.ADMIN_STAFFS)
@RequiredArgsConstructor
public class AdminStaffController {

    private final StaffService adminStaffService;
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
        model.addAttribute("statuses", StaffStatus.values());
        model.addAttribute("employmentTypes", EmploymentType.values());

        return SchoolmateUrls.ADMIN_STAFFS + "/main";
    }

    @GetMapping("/create")
    public String createForm(Model model) {
        model.addAttribute("departments", List.of("행정실", "시설관리실", "급식실", "전산실", "당직실", "기타"));
        model.addAttribute("employmentTypes", EmploymentType.values());
        return SchoolmateUrls.ADMIN_STAFFS + "/create";
    }

    @PostMapping("/create")
    public String create(@ModelAttribute StaffDTO.CreateRequest request, RedirectAttributes ra) {
        try {
            adminStaffService.createStaff(request);
            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
            return "redirect:" + SchoolmateUrls.ADMIN_STAFFS + "/" + user.getUid();
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "등록 실패: " + e.getMessage());
            return "redirect:" + SchoolmateUrls.ADMIN_STAFFS + "/create";
        }
    }

    @GetMapping("/{uid}")
    public String detail(@PathVariable Long uid, Model model) {
        StaffDTO.DetailResponse staff = adminStaffService.getStaffDetail(uid);
        model.addAttribute("staff", staff);
        model.addAttribute("statusList", StaffStatus.values());
        model.addAttribute("employmentTypes", EmploymentType.values());
        model.addAttribute("departments", List.of("행정실", "시설관리실", "급식실", "전산실", "당직실", "기타"));
        model.addAttribute("allRoles", UserRole.values()); // 권한 목록 추가
        return SchoolmateUrls.ADMIN_STAFFS + "/detail";
    }

    @PostMapping("/update")
    public String update(@ModelAttribute StaffDTO.UpdateRequest request, RedirectAttributes ra) {
        try {
            adminStaffService.updateStaff(request);
            ra.addFlashAttribute("successMessage", "교직원 정보가 수정되었습니다.");
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "수정 실패: " + e.getMessage());
        }
        return "redirect:" + SchoolmateUrls.ADMIN_STAFFS + "/" + request.getUid();
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

    @PostMapping("/{uid}/add-role")
    public String addRole(@PathVariable Long uid, @RequestParam("role") String role, RedirectAttributes ra) {
        adminStaffService.addRole(uid, role);
        ra.addFlashAttribute("successMessage", "권한이 추가되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_STAFFS + "/" + uid + "#roles";
    }

    @PostMapping("/{uid}/remove-role")
    public String removeRole(@PathVariable Long uid, @RequestParam("role") String role, RedirectAttributes ra) {
        adminStaffService.removeRole(uid, role);
        ra.addFlashAttribute("successMessage", "권한이 삭제되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_STAFFS + "/" + uid + "#roles";
    }
}
