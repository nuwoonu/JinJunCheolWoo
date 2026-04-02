package com.example.schoolmate.admin.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.admin.service.TestDataService;
import com.example.schoolmate.config.SchoolmateUrls;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 테스트 모드 / 테스트 데이터 REST API (SUPER_ADMIN 전용)
 *
 * - GET  /api/admin/test/status  : 현재 testMode 값 조회
 * - POST /api/admin/test/toggle  : testMode ON/OFF 토글
 * - POST /api/admin/test/seed    : 테스트 데이터 일괄 생성
 */
@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_TEST)
@RequiredArgsConstructor
@PreAuthorize("@grants.isSuperAdmin()")
public class AdminTestApiController {

    private final TestDataService testDataService;

    /** 현재 테스트 모드 상태 조회 */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of("testMode", testDataService.isTestMode()));
    }

    /** 테스트 모드 토글 */
    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggle() {
        boolean newValue = testDataService.toggleTestMode();
        log.info("testMode 변경: {}", newValue);
        return ResponseEntity.ok(Map.of("testMode", newValue));
    }

    /** 테스트 데이터 일괄 생성 */
    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seed() {
        log.info("테스트 데이터 생성 요청");
        Map<String, Object> result = testDataService.seedAll();
        return ResponseEntity.ok(result);
    }
}
