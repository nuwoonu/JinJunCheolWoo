package com.example.schoolmate.parkjoon.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.parkjoon.service.AdminStudentService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/parkjoon/admin/students")
@RequiredArgsConstructor
public class AdminStudentController {

    private final AdminStudentService adminStudentService;

    // 1. 목록 페이지
    @GetMapping("")
    public String list(StudentDTO.StudentSearchCondition condition,
            @PageableDefault(size = 10) Pageable pageable,
            Model model) {
        if (condition == null) {
            condition = new StudentDTO.StudentSearchCondition();
        }

        Page<StudentDTO.SummaryResponse> students = adminStudentService.getStudentSummaryList(condition, pageable);

        model.addAttribute("students", students);
        model.addAttribute("condition", condition);

        return "parkjoon/admin/students/main";
    }

    // 2. 등록 페이지 이동
    @GetMapping("/create")
    public String createForm(Model model) {
        model.addAttribute("createRequest", new StudentDTO.CreateRequest());
        return "parkjoon/admin/students/create";
    }

    // 3. 상세 페이지 이동
    @GetMapping("/{studentIdentityNum}")
    public String detail(@PathVariable String studentIdentityNum,
            Model model,
            RedirectAttributes redirectAttributes) {
        try {
            StudentDTO.DetailResponse student = adminStudentService.getStudentDetailByIdentityNum(studentIdentityNum);
            model.addAttribute("student", student);
            return "parkjoon/admin/students/detail";
        } catch (IllegalArgumentException e) {
            // 존재하지 않는 학번일 경우 메시지를 담아 리다이렉트
            redirectAttributes.addFlashAttribute("errorMessage", "해당 학번의 학생이 존재하지 않습니다.");
            return "redirect:/parkjoon/admin/students";
        }
    }

    // 4. 등록 처리
    @PostMapping("/create")
    public String create(StudentDTO.CreateRequest request, RedirectAttributes redirectAttributes) {
        try {
            // 서비스에서 저장된 학번을 받아옴
            String identityNum = adminStudentService.createStudent(request);

            // 상세 페이지로 이동
            return "redirect:/parkjoon/admin/students/" + identityNum;
        } catch (Exception e) {
            // 중복 학번 등 예외 발생 시 에러 메시지와 함께 작성 폼으로 유지
            redirectAttributes.addFlashAttribute("errorMessage", "등록 중 오류가 발생했습니다: " + e.getMessage());
            return "redirect:/parkjoon/admin/students/create";
        }
    }

    // 기본 인적 사항 및 상태 수정
    @PostMapping("/update-basic")
    public String updateBasic(StudentDTO.UpdateRequest request, RedirectAttributes redirectAttributes) {
        adminStudentService.updateStudentBasicInfo(request);

        // 수정 후 다시 해당 학생의 상세 페이지로 이동 (학번 기준)
        redirectAttributes.addFlashAttribute("successMessage", "기본 정보가 수정되었습니다.");
        return "redirect:/parkjoon/admin/students/" + request.getStudentIdentityNum();
    }

    // 학적 이력 추가
    @PostMapping("/assignment/create")
    public String createAssignment(StudentDTO.AssignmentRequest request, RedirectAttributes redirectAttributes) {
        try {
            String identityNum = adminStudentService.createAssignment(request);
            redirectAttributes.addFlashAttribute("successMessage", request.getSchoolYear() + "학년도 배정 정보가 추가되었습니다.");
            return "redirect:/parkjoon/admin/students/" + identityNum + "#history";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "추가 실패: " + e.getMessage());
            // 에러 발생 시 되돌아갈 학번 조회
            StudentDTO.DetailResponse student = adminStudentService.getStudentDetail(request.getUid());
            return "redirect:/parkjoon/admin/students/" + student.getStudentIdentityNum() + "#history";
        }
    }

    // 학적 이력 수정
    @PostMapping("/assignment/update")
    public String updateAssignment(StudentDTO.AssignmentRequest request, RedirectAttributes redirectAttributes) {
        try {
            String identityNum = adminStudentService.updateAssignment(request);
            redirectAttributes.addFlashAttribute("successMessage", request.getSchoolYear() + "학년도 배정 정보가 수정되었습니다.");
            return "redirect:/parkjoon/admin/students/" + identityNum + "#history";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "수정 실패: " + e.getMessage());
            StudentDTO.DetailResponse student = adminStudentService.getStudentDetail(request.getUid());
            return "redirect:/parkjoon/admin/students/" + student.getStudentIdentityNum() + "#history";
        }
    }

    @PostMapping("/delete-assignment")
    public String deleteAssignment(@RequestParam Long uid, @RequestParam int schoolYear, RedirectAttributes ra) {
        String identityNum = adminStudentService.deleteAssignment(uid, schoolYear);
        ra.addFlashAttribute("successMessage", schoolYear + "학년도 이력이 삭제되었습니다.");
        return "redirect:/parkjoon/admin/students/" + identityNum + "#history";
    }

    @PostMapping("/import-csv")
    @ResponseBody
    public ResponseEntity<String> importCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("파일이 비어있습니다.");
        }

        try {
            adminStudentService.importStudentsFromCsv(file);
            return ResponseEntity.ok("성공적으로 등록되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("등록 중 오류 발생: " + e.getMessage());
        }
    }

    // 일괄 상태 변경 (예: 졸업 처리)
    @PostMapping("/bulk-status")
    @ResponseBody
    public ResponseEntity<String> bulkUpdateStatus(@RequestParam("uids") List<Long> uids,
            @RequestParam("status") String status) {
        try {
            adminStudentService.bulkUpdateStudentStatus(uids, status);
            return ResponseEntity.ok("선택한 학생들의 상태가 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("상태 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}