package com.example.schoolmate.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 학부모 관련 컨트롤러
 * TEACHER, ADMIN만 접근 가능 (조회만)
 */
@Controller
@RequestMapping("/parent")
@RequiredArgsConstructor
@Log4j2
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class ParentController {

    /**
     * 학부모 목록
     */
    @GetMapping("/list")
    public String parentList() {
        log.info("학부모 목록 페이지 요청");
        return "parent/parent-list";
    }

    /**
     * 학부모 상세 정보
     */
    @GetMapping("/details")
    public String parentDetails() {
        log.info("학부모 상세 페이지 요청");
        return "parent/parent-details";
    }
}
