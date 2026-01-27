package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 관리자 공지사항 게시판 컨트롤러
 * 
 * 학교 전체 공지사항 관리 페이지를 처리합니다.
 * - 공지사항 목록 및 작성 화면 연결
 */
@Controller
@RequestMapping("/parkjoon/admin/notices")
public class AdminNoticeBoardController {

    @GetMapping
    public String list() {
        return "parkjoon/admin/notices/main";
    }
}