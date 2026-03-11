package com.example.schoolmate.woo.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.woo.dto.ClassStudentDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * [woo] 교사 담당 학급 REST API - React 페이지 연동용
 * TeacherScheduleRestController와 동일한 패턴으로 인증 사용자 기반 동작
 */
@RestController
@RequestMapping("/api/teacher/myclass")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
@Log4j2
public class TeacherMyClassRestController {

    private final TeacherService teacherService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final UserRepository userRepository;

    /**
     * 담당 학급 및 학생 목록 조회 (React /teacher/myclass, /teacher/myclass/students)
     *
     * GET /api/teacher/myclass?year=2026
     */
    @GetMapping
    public ResponseEntity<?> getMyClass(
            Authentication authentication,
            @RequestParam(required = false) Integer year) {

        Long teacherId = getTeacherId(authentication);
        int targetYear = (year != null) ? year : LocalDate.now().getYear();

        try {
            ClassStudentDTO classInfo = teacherService.getMyClassStudents(teacherId, targetYear);
            log.info("[REST] 담당 학급 조회 - teacherId: {}, year: {}", teacherId, targetYear);
            return ResponseEntity.ok(classInfo);
        } catch (IllegalArgumentException e) {
            log.warn("[REST] 담당 학급 없음 - teacherId: {}", teacherId);
            return ResponseEntity.ok(Map.of("hasClassroom", false, "message", "담당 학급이 없습니다."));
        }
    }

    // ── 공통 헬퍼 ──────────────────────────────────────────────────────────

    private Long getTeacherId(Authentication authentication) {
        Long uid = getUid(authentication);
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        return teacherInfo.getId();
    }

    private Long getUid(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof AuthUserDTO authUserDTO) {
            return authUserDTO.getCustomUserDTO().getUid();
        }

        if (principal instanceof OAuth2User oAuth2User) {
            Map<String, Object> attrs = oAuth2User.getAttributes();
            String provider = attrs.containsKey("kakao_account") ? "kakao"
                    : attrs.containsKey("sub") ? "google" : null;
            String providerId = attrs.containsKey("id") ? String.valueOf(attrs.get("id"))
                    : attrs.containsKey("sub") ? (String) attrs.get("sub") : null;

            if (provider != null && providerId != null) {
                return userRepository.findByProviderAndProviderId(provider, providerId)
                        .map(User::getUid)
                        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            }
        }

        throw new IllegalArgumentException("인증 정보를 확인할 수 없습니다.");
    }
}
