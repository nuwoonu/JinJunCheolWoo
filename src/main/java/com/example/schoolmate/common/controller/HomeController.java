package com.example.schoolmate.common.controller;

import org.springframework.stereotype.Controller;
// import org.springframework.web.bind.annotation.GetMapping;

/**
 * 공통 홈 컨트롤러 (Joon)
 * "/" 경로는 LoginController에서 처리 (redirect:/login)
 */
@Controller
public class HomeController {

    // [Joon] 기존 "/" 매핑 - LoginController와 충돌로 주석 처리
    // @GetMapping("/")
    // public String getHome() {
    // return "index";
    // }

}
