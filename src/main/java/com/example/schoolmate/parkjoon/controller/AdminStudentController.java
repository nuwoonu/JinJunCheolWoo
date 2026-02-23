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

import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.service.ParentService;
import com.example.schoolmate.common.service.StudentService;
import com.example.schoolmate.common.service.SystemSettingService;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 학생 관리 컨트롤러
 * 
 * 학생 정보의 등록, 조회, 수정, 상태 변경을 처리합니다.
 * - 학생 목록 검색 및 상세 조회
 * - 신규 학생 등록(개별/CSV) 및 학적 이력(Assignment) 관리
 */
@Controller
@RequestMapping(SchoolmateUrls.ADMIN_STUDENTS)
@RequiredArgsConstructor
public class AdminStudentController {

    private final StudentService studentService;
    private final ParentService parentService; // 학부모 검색용
    private final SystemSettingService systemSettingService;

    // 1. 목록 페이지
    @GetMapping("")
    public String list(StudentDTO.StudentSearchCondition condition,
            @PageableDefault(size = 10) Pageable pageable,
            Model model) {
        if (condition == null) {
            condition = new StudentDTO.StudentSearchCondition();
        }

        Page<StudentDTO.SummaryResponse> students = studentService.getStudentSummaryList(condition, pageable);

        model.addAttribute("students", students);
        model.addAttribute("condition", condition);
        model.addAttribute("statuses", StudentStatus.values());

        return SchoolmateUrls.ADMIN_STUDENTS + "/main";
    }

    // 2. 등록 페이지 이동
    @GetMapping("/create")
    public String createForm(Model model) {
        StudentDTO.CreateRequest request = new StudentDTO.CreateRequest();
        int currentYear = systemSettingService.getCurrentSchoolYear();
        request.setYear(currentYear); // 기본 학년도 설정

        model.addAttribute("createRequest", request);
        model.addAttribute("currentYear", currentYear);
        model.addAttribute("relationships", FamilyRelationship.values());
        model.addAttribute("classrooms", studentService.getOpenClassrooms(currentYear));
        return SchoolmateUrls.ADMIN_STUDENTS + "/create";
    }

    // 3. 상세 페이지 이동
    @GetMapping("/{uid}")
    public String detail(@PathVariable Long uid,
            Model model,
            RedirectAttributes redirectAttributes) {
        try {
            StudentDTO.DetailResponse student = studentService.getStudentDetail(uid);
            model.addAttribute("student", student);
            model.addAttribute("relationships", FamilyRelationship.values());
            model.addAttribute("currentYear", systemSettingService.getCurrentSchoolYear());
            return SchoolmateUrls.ADMIN_STUDENTS + "/detail";
        } catch (IllegalArgumentException e) {
            // 존재하지 않는 학생일 경우 메시지를 담아 리다이렉트
            redirectAttributes.addFlashAttribute("errorMessage", "해당 학생이 존재하지 않습니다.");
            return "redirect:" + SchoolmateUrls.ADMIN_STUDENTS;
        }
    }

    // 4. 등록 처리
    @PostMapping("/create")
    public String create(StudentDTO.CreateRequest request, RedirectAttributes redirectAttributes) {
        try {
            // 서비스에서 저장된 UID를 받아옴
            Long uid = studentService.createStudent(request);

            // 상세 페이지로 이동
            return "redirect:" + SchoolmateUrls.ADMIN_STUDENTS + "/" + uid;
        } catch (Exception e) {
            // 중복 학번 등 예외 발생 시 에러 메시지와 함께 작성 폼으로 유지
            redirectAttributes.addFlashAttribute("errorMessage", "등록 중 오류가 발생했습니다: " + e.getMessage());
            return "redirect:" + SchoolmateUrls.ADMIN_STUDENTS + "/create";
        }
    }

    // 기본 인적 사항 및 상태 수정
    @PostMapping("/update-basic")
    public String updateBasic(StudentDTO.UpdateRequest request, RedirectAttributes redirectAttributes) {
        studentService.updateStudentBasicInfo(request);

        // 수정 후 다시 해당 학생의 상세 페이지로 이동 (UID 기준)
        redirectAttributes.addFlashAttribute("successMessage", "기본 정보가 수정되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_STUDENTS + "/" + request.getUid();
    }

    // 학적 이력 수정
    @PostMapping("/assignment/update")
    public String updateAssignment(StudentDTO.AssignmentRequest request, RedirectAttributes redirectAttributes) {
        try {
            Long uid = studentService.updateAssignment(request);
            redirectAttributes.addFlashAttribute("successMessage", request.getSchoolYear() + "학년도 배정 정보가 수정되었습니다.");
            return "redirect:" + SchoolmateUrls.ADMIN_STUDENTS + "/" + uid + "#history";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "수정 실패: " + e.getMessage());
            return "redirect:" + SchoolmateUrls.ADMIN_STUDENTS + "/" + request.getUid() + "#history";
        }
    }

    @PostMapping("/delete-assignment")
    public String deleteAssignment(@RequestParam("uid") Long uid,
            @RequestParam("schoolYear") int schoolYear, RedirectAttributes ra) {
        Long studentUid = studentService.deleteAssignment(uid, schoolYear);
        ra.addFlashAttribute("successMessage", schoolYear + "학년도 이력이 삭제되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_STUDENTS + "/" + studentUid + "#history";
    }

    @PostMapping("/import-csv")
    @ResponseBody
    public ResponseEntity<String> importCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("파일이 비어있습니다.");
        }

        try {
            studentService.importStudentsFromCsv(file);
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
            studentService.bulkUpdateStudentStatus(uids, status);
            return ResponseEntity.ok("선택한 학생들의 상태가 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("상태 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 학부모 검색 API
    @GetMapping("/search-parent")
    @ResponseBody
    public ResponseEntity<Page<ParentDTO.Summary>> searchParent(@RequestParam("keyword") String keyword,
            Pageable pageable) {
        ParentDTO.ParentSearchCondition cond = new ParentDTO.ParentSearchCondition();
        cond.setType("name");
        cond.setKeyword(keyword);
        return ResponseEntity.ok(parentService.getParentList(cond, pageable));
    }

    @PostMapping("/{uid}/add-guardian")
    @ResponseBody
    public ResponseEntity<String> addGuardian(@PathVariable Long uid, @RequestParam("parentId") Long parentId,
            @RequestParam("relationship") FamilyRelationship relationship) {
        studentService.addGuardian(uid, parentId, relationship);
        return ResponseEntity.ok("보호자가 추가되었습니다.");
    }

    @PostMapping("/{uid}/update-guardian-relation")
    @ResponseBody
    public ResponseEntity<String> updateGuardianRelation(@PathVariable Long uid,
            @RequestParam("parentId") Long parentId,
            @RequestParam("relationship") FamilyRelationship relationship) {
        studentService.updateGuardianRelationship(uid, parentId, relationship);
        return ResponseEntity.ok("관계가 수정되었습니다.");
    }

    @PostMapping("/{uid}/remove-guardian")
    @ResponseBody
    public ResponseEntity<String> removeGuardian(@PathVariable Long uid, @RequestParam("parentId") Long parentId) {
        studentService.removeGuardian(uid, parentId);
        return ResponseEntity.ok("연동이 해제되었습니다.");
    }

    // 학급 목록 조회 API (수정 모달용)
    @GetMapping("/api/classrooms")
    @ResponseBody
    public ResponseEntity<List<ClassDTO.DetailResponse>> getClassrooms(@RequestParam int year) {
        return ResponseEntity.ok(studentService.getOpenClassrooms(year));
    }
}