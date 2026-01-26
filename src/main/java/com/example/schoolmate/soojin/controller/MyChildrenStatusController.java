package com.example.schoolmate.soojin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RequestMapping("/soojin/mychildern")
@Controller
public class MyChildrenStatusController {
    @GetMapping("/statuss")
    public String myChildernPage() {
        return "soojin/mychildern/statuss";
    }

}
