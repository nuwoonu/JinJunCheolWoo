package com.example.schoolmate.domain.admin.controller;

import com.example.schoolmate.domain.student.dto.TransferDTO;
import com.example.schoolmate.domain.student.service.TransferService;
import com.example.schoolmate.global.config.SchoolmateUrls;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 전입 처리 REST API
 *
 * - 전입 대상 검색: GET /api/admin/transfer/search
 * - 전입 실행:     POST /api/admin/transfer
 *
 * 접근 권한: canManageStudents() | canManageTeachers() | canManageStaffs() 중 하나 이상 보유한 관리자
 */
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_TRANSFER)
@RequiredArgsConstructor
@PreAuthorize("@grants.canAccessAdmin()")
public class AdminTransferApiController {

    private final TransferService transferService;

    /**
     * 전입 대상 검색
     *
     * @param schoolId 검색할 학교 ID
     * @param role     역할 (STUDENT | TEACHER | STAFF)
     * @param keyword  이름 또는 코드 검색어 (선택)
     */
    @GetMapping("/search")
    public ResponseEntity<List<TransferDTO.MemberSummary>> search(
            @RequestParam Long schoolId,
            @RequestParam String role,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(transferService.search(schoolId, role, keyword));
    }

    /**
     * 전입 실행
     */
    @PostMapping
    public ResponseEntity<?> transfer(@RequestBody TransferDTO.TransferRequest request) {
        try {
            TransferDTO.TransferResult result = transferService.transfer(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("전입 처리 실패 (잘못된 요청): {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            log.warn("전입 처리 실패 (상태 오류): {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            log.error("전입 처리 중 예외 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("전입 처리 중 오류가 발생했습니다.");
        }
    }
}
