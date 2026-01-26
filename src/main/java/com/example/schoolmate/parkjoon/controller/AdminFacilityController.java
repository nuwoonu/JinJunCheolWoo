package com.example.schoolmate.parkjoon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

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