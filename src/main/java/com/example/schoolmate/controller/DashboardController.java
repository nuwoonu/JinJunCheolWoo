package com.example.schoolmate.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.example.schoolmate.common.dto.NoticeDTO;
import com.example.schoolmate.board.dto.ParentBoardDTO;
import com.example.schoolmate.common.service.NoticeService;
import com.example.schoolmate.board.service.ParentBoardService;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.service.SystemSettingService;
import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.ChildDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.woo.dto.ClassStudentDTO;

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

    // OAuth2 사용자 호환 - Authentication 객체로 처리 (01/30[woo])
    @GetMapping("/dashboard")
    public String getDashboard(Authentication authentication) {
        if (authentication == null) {
            return "redirect:/login";
        }

        // 권한에서 역할 추출
        String authority = authentication.getAuthorities().iterator().next().getAuthority();
        String role = authority.replace("ROLE_", "");

        return switch (role) {
            case "ADMIN" -> "redirect:/admin/dashboard";
            case "STUDENT" -> "redirect:/student/dashboard";
            case "TEACHER" -> "redirect:/teacher/dashboard";
            case "PARENT" -> "redirect:/parent/dashboard";
            default -> "redirect:/login";
        };
    }

    @GetMapping("/admin/dashboard")
    public String getAdminDashboard() {
        return "dashboard/admin";
    }

    // OAuth2 사용자 호환 - Authentication 객체로 처리
    @GetMapping("/student/dashboard")
    public String getStudentDashboard(Authentication authentication, Model model) {
        Long uid = getUidFromAuthentication(authentication);

        if (uid != null) {
            // 1. 학생 User 조회
            User studentUser = userRepository.findById(uid).orElse(null);
            if (studentUser != null) {
                StudentInfo studentInfo = studentUser.getInfo(StudentInfo.class);
                if (studentInfo != null) {
                    // 2. DTO 변환
                    StudentResponseDTO studentDTO = StudentResponseDTO.from(studentInfo);
                    model.addAttribute("student", studentDTO);

                    // 3. 프로필 이미지 조회
                    Profile profile = profileRepository.findByUser(studentUser).orElse(null);
                    if (profile != null && profile.getUuid() != null) {
                        String imageUrl = "/upload/" + profile.getPath() + "/" + profile.getUuid() + "_"
                                + profile.getImgName();
                        model.addAttribute("profileImageUrl", imageUrl);
                    }
                }
            }
        }

        // 4. 공지사항
        List<NoticeDTO.BoardNotice> notices = noticeService.getRecentList(5);
        model.addAttribute("notices", notices);

        return "cheol/student-dashboard";
    }

    // OAuth2 사용자 호환 - Authentication 객체로 처리 (01/30[woo])
    @GetMapping("/teacher/dashboard")
    public String getTeacherDashboard(Authentication authentication, Model model) {
        Long uid = getUidFromAuthentication(authentication);

        // 공지사항 (항상 조회)
        model.addAttribute("notices", noticeService.getRecentList(5));

        if (uid == null) {
            model.addAttribute("classInfo", null);
            model.addAttribute("teacherName", "선생님");
            model.addAttribute("teacherSubject", "");
            return "dashboard/teacher";
        }

        // 교사 이름
        User teacher = userRepository.findById(uid).orElse(null);
        model.addAttribute("teacherName", teacher != null && teacher.getName() != null ? teacher.getName() : "선생님");

        int currentYear = systemSettingService.getCurrentSchoolYear();

        // 교사 정보 조회 후 학급 정보 & 과목 정보 가져오기
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid).orElse(null);
        if (teacherInfo != null) {
            model.addAttribute("teacherSubject", teacherInfo.getSubject() != null ? teacherInfo.getSubject() : "");
            try {
                ClassStudentDTO classInfo = teacherService.getMyClassStudents(teacherInfo.getId(), currentYear);
                model.addAttribute("classInfo", classInfo);
            } catch (Exception e) {
                model.addAttribute("classInfo", null);
            }
            // [woo] 수업 일정은 React 위젯(GET /api/teacher/schedule/today)이 직접 로딩
        } else {
            model.addAttribute("teacherSubject", "");
            model.addAttribute("classInfo", null);
        }

        return "dashboard/teacher";
    }

    // OAuth2 사용자 호환 - Authentication 객체로 처리 (01/30[woo])
    @GetMapping("/parent/dashboard")
    public String getParentDashboard(Authentication authentication, Model model) {
        Long uid = getUidFromAuthentication(authentication);

        // OAuth2 사용자는 자녀 정보가 없으므로 빈 리스트로 설정
        if (uid == null) {
            model.addAttribute("children", new ArrayList<>());
            // 공지사항 최근 5개
            List<NoticeDTO.BoardNotice> notices = noticeService.getRecentList(5);
            model.addAttribute("notices", notices);
            // 게시판 최근 5개
            List<ParentBoardDTO> boards = parentBoardService.getRecentList(5);
            model.addAttribute("boards", boards);
            return "parent/dashboard";
        }

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
        List<NoticeDTO.BoardNotice> notices = noticeService.getRecentList(5);
        model.addAttribute("notices", notices);

        // 게시판 최근 5개
        List<ParentBoardDTO> boards = parentBoardService.getRecentList(5);
        model.addAttribute("boards", boards);

        return "parent/dashboard";

    }

    /**
     * Authentication 객체에서 사용자 UID 추출 (01/30[woo])
     * - 일반 로그인(AuthUserDTO): customUserDTO에서 uid 추출
     * - OAuth2 로그인(OAuth2User): provider/providerId로 DB에서 조회
     */
    private Long getUidFromAuthentication(Authentication authentication) {
        if (authentication == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();

        // 일반 로그인 사용자
        if (principal instanceof AuthUserDTO authUserDTO) {
            return authUserDTO.getCustomUserDTO().getUid();
        }

        // OAuth2 로그인 사용자
        if (principal instanceof OAuth2User oAuth2User) {
            Map<String, Object> attributes = oAuth2User.getAttributes();
            String providerId = extractProviderId(attributes);
            String provider = getProvider(attributes);

            if (providerId != null && provider != null) {
                return userRepository.findByProviderAndProviderId(provider, providerId)
                        .map(User::getUid)
                        .orElse(null);
            }
        }

        return null;
    }

    /**
     * OAuth2 attributes에서 providerId 추출 (01/30[woo])
     */
    private String extractProviderId(Map<String, Object> attributes) {
        // 카카오
        if (attributes.containsKey("id")) {
            return String.valueOf(attributes.get("id"));
        }
        // 구글
        if (attributes.containsKey("sub")) {
            return (String) attributes.get("sub");
        }
        return null;
    }

    /**
     * OAuth2 attributes에서 provider 추출 (01/30[woo])
     */
    private String getProvider(Map<String, Object> attributes) {
        if (attributes.containsKey("kakao_account")) {
            return "kakao";
        }
        if (attributes.containsKey("sub")) {
            return "google";
        }
        return null;
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
