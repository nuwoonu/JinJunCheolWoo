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

import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
import com.example.schoolmate.parkjoon.service.AdminParentService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/parkjoon/admin/parents")
@RequiredArgsConstructor
public class AdminParentController {

    private final AdminParentService adminParentService;

    @GetMapping
    public String list(ParentDTO.ParentSearchCondition condition,
            @PageableDefault(size = 10) Pageable pageable,
            Model model) {

        if (condition == null) {
            condition = new ParentDTO.ParentSearchCondition();
        }

        Page<ParentDTO.Summary> parents = adminParentService.getParentList(condition, pageable);

        model.addAttribute("parents", parents);
        model.addAttribute("condition", condition);

        return "parkjoon/admin/parents/main";
    }

    @GetMapping("/create")
    public String createForm(Model model) {
        model.addAttribute("createRequest", new ParentDTO.CreateRequest());
        model.addAttribute("relationships", FamilyRelationship.values());
        return "parkjoon/admin/parents/create";
    }

    @PostMapping("/create")
    public String create(ParentDTO.CreateRequest request, RedirectAttributes ra) {
        try {
            adminParentService.createParent(request);
            ra.addFlashAttribute("successMessage", "학부모 계정이 생성되었습니다.");
            return "redirect:/parkjoon/admin/parents";
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "등록 실패: " + e.getMessage());
            return "redirect:/parkjoon/admin/parents/create";
        }
    }

    @PostMapping("/import-csv")
    @ResponseBody
    public ResponseEntity<String> importCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty())
            return ResponseEntity.badRequest().body("파일이 없습니다.");
        try {
            adminParentService.importParentsFromCsv(file);
            return ResponseEntity.ok("일괄 등록이 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("오류 발생: " + e.getMessage());
        }
    }

    // 일괄 상태 변경
    @PostMapping("/bulk-status")
    @ResponseBody
    public ResponseEntity<String> bulkUpdateStatus(@RequestParam("ids") List<Long> ids,
            @RequestParam("status") String status) {
        try {
            adminParentService.bulkUpdateParentStatus(ids, status);
            return ResponseEntity.ok("선택한 학부모들의 상태가 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("상태 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 상세 페이지
    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        ParentDTO.DetailResponse parent = adminParentService.getParentDetail(id);
        model.addAttribute("parent", parent);
        model.addAttribute("statuses", ParentStatus.values());
        model.addAttribute("relationships", FamilyRelationship.values());
        return "parkjoon/admin/parents/detail";
    }

    // 학생 검색 API (AJAX)
    @GetMapping("/search-student")
    @ResponseBody
    public ResponseEntity<List<StudentDTO.SummaryResponse>> searchStudent(@RequestParam String keyword) {
        return ResponseEntity.ok(adminParentService.searchStudentsForLinking(keyword));
    }

    @PostMapping("/update")
    public String update(ParentDTO.UpdateRequest request, RedirectAttributes ra) {
        adminParentService.updateParent(request);
        ra.addFlashAttribute("successMessage", "정보가 수정되었습니다.");
        return "redirect:/parkjoon/admin/parents/" + request.getId();
    }

    @PostMapping("/{parentId}/add-child")
    @ResponseBody
    public ResponseEntity<String> addChild(@PathVariable Long parentId, @RequestParam Long studentUid,
            @RequestParam FamilyRelationship relationship) {
        adminParentService.addChild(parentId, studentUid, relationship);
        return ResponseEntity.ok("자녀가 추가되었습니다.");
    }

    @PostMapping("/{parentId}/update-child-relation")
    @ResponseBody
    public ResponseEntity<String> updateChildRelation(@PathVariable Long parentId, @RequestParam Long studentUid,
            @RequestParam FamilyRelationship relationship) {
        adminParentService.updateChildRelationship(parentId, studentUid, relationship);
        return ResponseEntity.ok("관계가 수정되었습니다.");
    }

    @PostMapping("/{parentId}/remove-child")
    @ResponseBody
    public ResponseEntity<String> removeChild(@PathVariable Long parentId, @RequestParam Long studentUid) {
        adminParentService.removeChild(parentId, studentUid);
        return ResponseEntity.ok("연동이 해제되었습니다.");
    }
}