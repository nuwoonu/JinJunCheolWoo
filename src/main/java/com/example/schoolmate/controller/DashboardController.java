package com.example.schoolmate.controller;

import java.util.ArrayList;
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
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.common.service.SystemSettingService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.ChildDTO;
import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.service.TeacherService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Controller
@RequiredArgsConstructor
@Log4j2
public class DashboardController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final NoticeService noticeService;
    private final ParentBoardService parentBoardService;
    private final TeacherService teacherService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final SystemSettingService systemSettingService;

    @GetMapping("/board")
    public String getBoard() {
        return "redirect:/dashboard";
    }

    @GetMapping("/index")
    public String getMethodName() {
        return "/dashboard/index";
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
    public String getTeacherDashboard(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();
        int currentYear = systemSettingService.getCurrentSchoolYear();

        // 교사 정보 조회 후 학급 정보 가져오기
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid).orElse(null);
        if (teacherInfo != null) {
            try {
                ClassStudentDTO classInfo = teacherService.getMyClassStudents(teacherInfo.getId(), currentYear);
                model.addAttribute("classInfo", classInfo);
            } catch (Exception e) {
                // 담당 학급이 없는 경우
                model.addAttribute("classInfo", null);
            }
        } else {
            model.addAttribute("classInfo", null);
        }

        return "dashboard/teacher";
    }

    @GetMapping("/parent/dashboard")
    public String getParentDashboard(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
        Long uid = authUserDTO.getCustomUserDTO().getUid();

        // 자녀 목록 (새 구조: User → ParentInfo → FamilyRelation → StudentInfo)
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

        // 공지사항 최근 5개
        List<NoticeDTO> notices = noticeService.getRecentList(5);
        model.addAttribute("notices", notices);

        // 게시판 최근 5개
        List<ParentBoardDTO> boards = parentBoardService.getRecentList(5);
        model.addAttribute("boards", boards);

        return "parent/dashboard";

    }

    /**
     * StudentInfo → ChildDTO 변환
     */
    private ChildDTO convertToChildDTO(StudentInfo studentInfo) {
        User studentUser = studentInfo.getUser();

        // 프로필 이미지 조회
        String imageUrl = null;
        Profile profile = profileRepository.findByUser(studentUser).orElse(null);
        if (profile != null && profile.getUuid() != null) {
            imageUrl = "/upload/" + profile.getPath() + "/" + profile.getUuid() + "_" + profile.getImgName();
        }

        // 현재 학년도 배정 정보
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
