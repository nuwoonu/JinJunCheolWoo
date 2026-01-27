package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 관리자 감사 로그 컨트롤러
 * 
 * 시스템 보안 및 운영 투명성을 위한 감사 로그 페이지를 처리합니다.
 * - 사용자 접속 기록 및 데이터 변경 이력 조회 화면 연결
 */
@Controller
@RequestMapping("/parkjoon/admin/audit")
public class AdminAuditController {

    @GetMapping("/access")
    public String accessLogs() {
        return "parkjoon/admin/audit/access";
    }

    @GetMapping("/changes")
    public String changeLogs() {
        return "parkjoon/admin/audit/changes";
    }
}