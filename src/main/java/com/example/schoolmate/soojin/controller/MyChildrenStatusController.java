package com.example.schoolmate.soojin.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.dto.dashboardinfo.SchoolCalendarDTO;
import com.example.schoolmate.common.dto.dashboardinfo.SchoolMealDTO;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.service.SystemSettingService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.ChildDTO;
import com.example.schoolmate.soojin.repository.SchoolMealRepository;
import com.example.schoolmate.soojin.service.CalendarService;
import com.example.schoolmate.soojin.service.SchoolMealService;

import lombok.RequiredArgsConstructor;

@RequestMapping("/soojin/mychildren")
@Controller
@PreAuthorize("hasRole('PARENT')")
@RequiredArgsConstructor
public class MyChildrenStatusController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final SystemSettingService systemSettingService;
    private final CalendarService calendarService;
    private final SchoolMealService schoolMealService;

    // 학부모 - 자녀 대시보드
    @GetMapping("/status")
    public String myChildrenPage(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();

        User parentUser = userRepository.findById(uid).orElse(null);
        if (parentUser != null) {
            ParentInfo parentInfo = parentUser.getInfo(ParentInfo.class);
            if (parentInfo != null && parentInfo.getChildrenRelations() != null) {
                List<ChildDTO> children = parentInfo.getChildrenRelations().stream()
                        .map(relation -> convertToChildDTO(relation.getStudentInfo()))
                        .collect(Collectors.toList());
                model.addAttribute("children", children);
            } else {
                model.addAttribute("children", new ArrayList<>());
            }
        } else {
            model.addAttribute("children", new ArrayList<>());
        }
        // 다가오는 일정
        List<SchoolCalendarDTO> upcomingEvents = calendarService.getUpcomingEvents(5);
        model.addAttribute("upcomingEvents", upcomingEvents);

        // 오늘의 급식 (중식 기준)
        List<SchoolMealDTO> todayMeal = schoolMealService.getDailyMeal(LocalDate.now(), null);
        model.addAttribute("todayMeal", todayMeal);

        return "soojin/mychildren/status";
    }

    private ChildDTO convertToChildDTO(StudentInfo studentInfo) {
        User studentUser = studentInfo.getUser();

        String imageUrl = null;
        Profile profile = profileRepository.findByUser(studentUser).orElse(null);
        if (profile != null && profile.getUuid() != null) {
            imageUrl = "/upload/" + profile.getPath() + "/" + profile.getUuid() + "_" + profile.getImgName();
        }

        StudentAssignment assignment = studentInfo.getCurrentAssignment();

        return ChildDTO.builder()
                .id(studentUser.getUid())
                .name(studentUser.getName())
                .studentNumber(studentInfo.getCode())
                .grade(assignment != null ? assignment.getGrade() : null)
                .classNum(assignment != null ? assignment.getClassNum() : null)
                .profileImageUrl(imageUrl)
                .build();
    }

}
