package com.example.schoolmate.admin.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
import com.example.schoolmate.common.service.ParentService;

import lombok.RequiredArgsConstructor;

// 학부모 관리 REST API
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_PARENTS)
@RequiredArgsConstructor
public class AdminParentApiController {

    private final ParentService parentService;

    @GetMapping
    public ResponseEntity<Page<ParentDTO.Summary>> list(
            ParentDTO.ParentSearchCondition condition,
            @PageableDefault(size = 10) Pageable pageable) {
        if (condition == null)
            condition = new ParentDTO.ParentSearchCondition();
        return ResponseEntity.ok(parentService.getParentList(condition, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParentDTO.DetailResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(parentService.getParentDetail(id));
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody ParentDTO.CreateRequest request) {
        try {
            parentService.createParent(request);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody ParentDTO.UpdateRequest request) {
        request.setId(id);
        parentService.updateParent(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-status")
    public ResponseEntity<String> bulkStatus(@RequestBody ParentDTO.BulkStatusRequest request) {
        try {
            parentService.bulkUpdateParentStatus(request.getIds(), request.getStatus());
            return ResponseEntity.ok("상태 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/import-csv")
    public ResponseEntity<String> importCsv(@RequestParam MultipartFile file) {
        try {
            parentService.importParentsFromCsv(file);
            return ResponseEntity.ok("등록되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 학생 검색 (자녀 연동용)
    @GetMapping("/search-student")
    public ResponseEntity<List<StudentDTO.SummaryResponse>> searchStudent(@RequestParam String keyword) {
        return ResponseEntity.ok(parentService.searchStudentsForLinking(keyword));
    }

    @PostMapping("/{parentId}/child")
    public ResponseEntity<String> addChild(@PathVariable Long parentId,
            @RequestParam Long studentUid, @RequestParam FamilyRelationship relationship) {
        parentService.addChild(parentId, studentUid, relationship);
        return ResponseEntity.ok("추가되었습니다.");
    }

    @PutMapping("/{parentId}/child")
    public ResponseEntity<String> updateChildRelation(@PathVariable Long parentId,
            @RequestParam Long studentUid, @RequestParam FamilyRelationship relationship) {
        parentService.updateChildRelationship(parentId, studentUid, relationship);
        return ResponseEntity.ok("수정되었습니다.");
    }

    @DeleteMapping("/{parentId}/child/{studentUid}")
    public ResponseEntity<String> removeChild(@PathVariable Long parentId, @PathVariable Long studentUid) {
        parentService.removeChild(parentId, studentUid);
        return ResponseEntity.ok("해제되었습니다.");
    }
}
