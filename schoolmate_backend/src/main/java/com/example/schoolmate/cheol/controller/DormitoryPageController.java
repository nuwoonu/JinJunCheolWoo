package com.example.schoolmate.cheol.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dormitory")
public class DormitoryPageController {

    @GetMapping
    public String dormitoryPage() {
        return "cheol/dormitory";
    }
}
