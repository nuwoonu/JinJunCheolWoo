package com.example.schoolmate.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.example.schoolmate.board.dto.NoticeDTO;
import com.example.schoolmate.board.dto.ParentBoardDTO;
import com.example.schoolmate.board.service.NoticeService;
import com.example.schoolmate.board.service.ParentBoardService;
import com.example.schoolmate.common.entity.Parent;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.entity.Student;
import com.example.schoolmate.common.repository.ParentRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.ChildDTO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final ParentRepository parentRepository;
    private final NoticeService noticeService;
    private final ParentBoardService parentBoardService;

    @GetMapping("/board")
    public String getBoard() {
        return "redirect:/dashboard";
    }

    @GetMapping("/dashboard")
    public String getDashboard(@AuthenticationPrincipal AuthUserDTO authUserDTO) {
        if (authUserDTO == null) {
            return "redirect:/login";
        }

        String role = authUserDTO.getCustomUserDTO().getRole().name();

        return switch (role) {
            case "ADMIN" -> "redirect:/admin/dashboard";
            case "STUDENT" -> "redirect:/student/dashboard";
            case "TEACHER" -> "redirect:/teacher/dashboard";
            case "PARENT" -> "redirect:/parent/dashboard";
            default -> "redirect:/admin/dashboard";
        };
    }

    @GetMapping("/admin/dashboard")
    public String getAdminDashboard() {
        return "dashboard/admin";
    }

    @GetMapping("/student/dashboard")
    public String getStudentDashboard() {
        return "dashboard/student";
    }

    @GetMapping("/teacher/dashboard")
    public String getTeacherDashboard() {
        return "dashboard/teacher";
    }

    @GetMapping("/parent/dashboard")
    public String getParentDashboard(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();

        // 자녀 목록
        Parent parent = parentRepository.findById(uid).orElse(null);
        if (parent != null) {
            List<ChildDTO> children = parent.getChildren().stream()
                .map(student -> convertToChildDTO(student))
                .collect(Collectors.toList());
            model.addAttribute("children", children);
        }

        // 공지사항 최근 5개
        List<NoticeDTO> notices = noticeService.getRecentList(5);
        model.addAttribute("notices", notices);

        // 게시판 최근 5개
        List<ParentBoardDTO> boards = parentBoardService.getRecentList(5);
        model.addAttribute("boards", boards);

        return "parent/dashboard";
    }

    private ChildDTO convertToChildDTO(Student student) {
        String imageUrl = null;
        Profile profile = student.getProfile();
        if (profile != null && profile.getUuid() != null) {
            imageUrl = "/upload/" + profile.getPath() + "/" + profile.getUuid() + "_" + profile.getImgName();
        }

        return ChildDTO.builder()
            .id(student.getUid())
            .name(student.getName())
            .studentNumber(student.getStudentNumber())
            .grade(student.getGrade())
            .classNum(student.getClassNum())
            .profileImageUrl(imageUrl)
            .build();
    }
}
