package com.example.schoolmate.soojin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.soojin.service.SchoolMealService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Log4j2
@RequestMapping("/soojin")
@RequiredArgsConstructor
@Controller
public class SchoolMealController {

    private final SchoolMealService schoolMealService;

    @GetMapping("/meal/monthly")
    public String monthlyView(@RequestParam("param") String param) {
        return "soojin/meal/monthly";
    }

    @GetMapping("/meal/list")
    public String listView(@RequestParam("param") String param) {
        return "soojin/meal/list";
    }

}
