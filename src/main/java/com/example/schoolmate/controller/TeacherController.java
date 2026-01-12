package com.example.schoolmate.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/teacher")
public class TeacherController {

    @GetMapping("/list")
    public String teacherList() {
        return "teacher/teacher-list";
    }

    @GetMapping("/add")
    public String addTeacher() {
        return "teacher/add-new-teacher";
    }

    @GetMapping("/edit")
    public String editTeacher() {
        return "teacher/edit-teacher";
    }

    @GetMapping("/details")
    public String teacherDetails() {
        return "teacher/teacher-details";
    }

    @GetMapping("/attendance")
    public String teacherAttendance() {
        return "teacher/teacher-attendance";
    }
}
