package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 관리자 시설/자산 관리 컨트롤러
 * 
 * 학교 시설(강의실, 특별실) 및 기자재(노트북, 태블릿 등) 관리 페이지를 처리합니다.
 * - 시설 및 자산 목록 조회 화면 연결
 */
@Controller
@RequestMapping("/parkjoon/admin/facilities")
public class AdminFacilityController {

    @GetMapping("/rooms")
    public String rooms() {
        return "parkjoon/admin/facilities/rooms";
    }

    @GetMapping("/assets")
    public String assets() {
        return "parkjoon/admin/facilities/assets";
    }
}