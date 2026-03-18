package com.example.schoolmate.controller.api;

import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.info.student.StudentAssignmentRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.domain.board.entity.BoardType;
import com.example.schoolmate.domain.board.service.BoardService;
import com.example.schoolmate.common.service.SystemSettingService;
import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.ChildDTO;
import com.example.schoolmate.woo.dto.ClassStudentDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardApiController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final BoardService boardService;
    private final TeacherService teacherService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final SystemSettingService systemSettingService;
    private final StudentAssignmentRepository studentAssignmentRepository;

    @GetMapping("/student")
    ResponseEntity<?> studentDashboard(Authentication authentication) {
        Long uid = getUid(authentication);
        Map<String, Object> data = new HashMap<>();

        if (uid != null) {
            User user = userRepository.findById(uid).orElse(null);
            if (user != null) {
                StudentInfo info = user.getInfo(StudentInfo.class);
                if (info != null) {
                    data.put("student", StudentResponseDTO.from(info));
                }
                profileRepository.findByUser(user).ifPresent(p -> {
                    if (p.getUuid() != null) {
                        data.put("profileImageUrl",
                                "/upload/" + p.getPath() + "/" + p.getUuid() + "_" + p.getImgName());
                    }
                });
            }
        }

        data.put("notices", boardService.getRecentBoards(BoardType.SCHOOL_NOTICE, 5));
        return ResponseEntity.ok(data);
    }

    @GetMapping("/teacher")
    ResponseEntity<?> teacherDashboard(Authentication authentication) {
        Long uid = getUid(authentication);
        Map<String, Object> data = new HashMap<>();

        data.put("notices", boardService.getRecentBoards(BoardType.SCHOOL_NOTICE, 5));

        if (uid == null) {
            data.put("teacherName", "선생님");
            data.put("teacherSubject", "");
            data.put("classInfo", null);
            return ResponseEntity.ok(data);
        }

        User teacher = userRepository.findById(uid).orElse(null);
        data.put("teacherName", teacher != null && teacher.getName() != null ? teacher.getName() : "선생님");

        int currentYear = systemSettingService.getCurrentSchoolYear();
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid).orElse(null);
        if (teacherInfo != null) {
            data.put("teacherSubject", teacherInfo.getSubject() != null ? teacherInfo.getSubject() : "");
            // [woo] 교사 소속 학교 이름
            data.put("schoolName", teacherInfo.getSchool() != null ? teacherInfo.getSchool().getName() : null);
            try {
                ClassStudentDTO classInfo = teacherService.getMyClassStudents(teacherInfo.getId(), currentYear);
                data.put("classInfo", classInfo);
            } catch (Exception e) {
                data.put("classInfo", null);
            }
        } else {
            data.put("teacherSubject", "");
            data.put("schoolName", null);
            data.put("classInfo", null);
        }

        return ResponseEntity.ok(data);
    }

    @GetMapping("/parent")
    ResponseEntity<?> parentDashboard(Authentication authentication) {
        Long uid = getUid(authentication);
        Map<String, Object> data = new HashMap<>();

        if (uid == null) {
            data.put("children", Collections.emptyList());
            data.put("parentProfile", null);
            return ResponseEntity.ok(data);
        }

        User parentUser = userRepository.findById(uid).orElse(null);
        if (parentUser != null) {
            // 학부모 프로필 정보
            ParentInfo parentInfo = parentUser.getInfo(ParentInfo.class);
            Map<String, Object> profile = new HashMap<>();
            // name: User.name 우선, 없으면 ParentInfo.parentName
            String name = parentUser.getName();
            if ((name == null || name.isBlank()) && parentInfo != null)
                name = parentInfo.getParentName();
            // phone: ParentInfo.phone 우선, 없으면 User.phoneNumber
            String phone = parentInfo != null ? parentInfo.getPhone() : null;
            if (phone == null || phone.isBlank())
                phone = parentUser.getPhoneNumber();
            profile.put("name", name);
            profile.put("email", parentUser.getEmail());
            profile.put("phone", phone);
            profile.put("address", parentInfo != null ? parentInfo.getAddress() : null);
            data.put("parentProfile", profile);

            // 자녀 목록
            if (parentInfo != null && parentInfo.getChildrenRelations() != null) {
                List<ChildDTO> children = parentInfo.getChildrenRelations().stream()
                        .map(r -> toChildDTO(r.getStudentInfo()))
                        .collect(Collectors.toList());
                data.put("children", children);
            } else {
                data.put("children", Collections.emptyList());
            }
        } else {
            data.put("parentProfile", null);
            data.put("children", Collections.emptyList());
        }

        return ResponseEntity.ok(data);
    }

    // --- 헬퍼 ---

    private Long getUid(Authentication authentication) {
        if (authentication == null)
            return null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthUserDTO dto) {
            return dto.getCustomUserDTO().getUid();
        }
        if (principal instanceof OAuth2User oauth) {
            Map<String, Object> attrs = oauth.getAttributes();
            String providerId = attrs.containsKey("id") ? String.valueOf(attrs.get("id"))
                    : (String) attrs.get("sub");
            String provider = attrs.containsKey("kakao_account") ? "kakao" : "google";
            if (providerId != null) {
                return userRepository.findByProviderAndProviderId(provider, providerId)
                        .map(User::getUid).orElse(null);
            }
        }
        return null;
    }

    private ChildDTO toChildDTO(StudentInfo info) {
        User user = info.getUser();
        String imageUrl = null;
        Profile profile = profileRepository.findByUser(user).orElse(null);
        if (profile != null && profile.getUuid() != null) {
            imageUrl = "/upload/" + profile.getPath() + "/" + profile.getUuid() + "_" + profile.getImgName();
        }
        StudentAssignment assignment = info.getCurrentAssignment();

        // [woo] 번호: 같은 학급 학생을 이름 가나다 순으로 정렬 후 순번 계산
        Integer attendanceNum = null;
        if (assignment != null && assignment.getClassroom() != null) {
            List<StudentAssignment> classmates = studentAssignmentRepository
                    .findByClassroomAndSchoolYear(assignment.getClassroom(), assignment.getSchoolYear());
            List<String> sortedNames = classmates.stream()
                    .map(a -> a.getStudentInfo().getUser().getName())
                    .sorted(java.text.Collator.getInstance(java.util.Locale.KOREAN)::compare)
                    .collect(java.util.stream.Collectors.toList());
            int idx = sortedNames.indexOf(user.getName());
            attendanceNum = idx >= 0 ? idx + 1 : null;
        }

        String schoolName = info.getSchool() != null ? info.getSchool().getName() : null;

        return ChildDTO.builder()
                .id(user.getUid())
                .studentInfoId(info.getId()) // [woo] 출결 조회용
                .name(user.getName())
                .grade(assignment != null ? assignment.getGrade() : null)
                .classNum(assignment != null ? assignment.getClassNum() : null)
                .attendanceNum(attendanceNum)
                .schoolName(schoolName)
                .profileImageUrl(imageUrl)
                .build();
    }
}
