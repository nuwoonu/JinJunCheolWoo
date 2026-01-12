package com.example.schoolmate.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/student")
public class StudentController {

    @GetMapping("/list")
    public String studentList() {
        return "student/student-list";
    }

    @GetMapping("/add")
    public String addStudent() {
        return "student/add-new-student";
    }

    @GetMapping("/edit")
    public String editStudent() {
        return "student/edit-student";
    }

    @GetMapping("/details")
    public String studentDetails() {
        return "student/student-details";
    }
}
