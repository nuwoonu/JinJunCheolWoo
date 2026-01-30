package com.example.schoolmate.parkjoon.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.schoolmate.common.dto.NotificationDTO;
import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.parkjoon.service.AdminNotificationService;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 알림 관리 컨트롤러
 * 
 * 관리자 페이지에서 발생하는 알림 발송 요청을 처리합니다.
 * - 개별 또는 그룹 알림 전송 API 제공
 */
@Controller
@RequestMapping(SchoolmateUrls.ADMIN_NOTIFICATIONS)
@RequiredArgsConstructor
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    @PostMapping("/send")
    @ResponseBody
    public ResponseEntity<String> sendNotification(@RequestBody NotificationDTO.SendRequest request) {
        try {
            adminNotificationService.sendNotification(request);
            return ResponseEntity.ok("알림이 성공적으로 발송되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("알림 발송 실패: " + e.getMessage());
        }
    }
}