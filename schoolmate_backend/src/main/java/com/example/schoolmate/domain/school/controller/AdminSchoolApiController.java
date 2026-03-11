package com.example.schoolmate.domain.school.controller;

import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.school.service.NeisService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(SchoolmateUrls.ADMIN_SCHOOLS)
@RequiredArgsConstructor
public class AdminSchoolApiController {

    private final NeisService neisService;

    @PostMapping("/sync")
    public ResponseEntity<String> syncSchools(Principal principal) {
        try {
            if (neisService.isSyncRunning()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("이미 동기화 작업이 백그라운드에서 실행 중입니다.\n잠시 후 다시 시도해주세요.");
            }
            String adminName = (principal != null) ? principal.getName() : "Unknown Admin";
            neisService.syncSchoolData(adminName);
            return ResponseEntity.ok("학교 정보 동기화 작업이 백그라운드에서 시작되었습니다.\n완료 시 서버 로그를 확인해주세요.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("동기화 실패: " + e.getMessage());
        }
    }
}
