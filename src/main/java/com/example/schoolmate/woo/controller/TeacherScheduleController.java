package com.example.schoolmate.woo.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.soojin.entity.constant.DayOfWeek;
import com.example.schoolmate.woo.dto.TeacherScheduleDTO;
import com.example.schoolmate.woo.entity.constant.RepeatType;
import com.example.schoolmate.woo.service.TeacherScheduleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 교사 수업 일정 관리 컨트롤러
 */
@Controller
@RequestMapping("/teacher/schedule")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
@Log4j2
public class TeacherScheduleController {

    private final TeacherScheduleService scheduleService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final UserRepository userRepository;

    /**
     * 일정 관리 페이지 (React Shell - 데이터는 /api/teacher/schedule 에서 로드)
     */
    @GetMapping
    public String schedulePage() {
        return "teacher/schedule/index";
    }

    /**
     * 일정 등록 폼
     */
    @GetMapping("/add")
    public String addForm(Model model) {
        model.addAttribute("dayOfWeekValues", DayOfWeek.values());
        model.addAttribute("repeatTypeValues", RepeatType.values());

        return "teacher/schedule/add";
    }

    /**
     * 일정 등록 처리
     */
    @PostMapping("/add")
    public String addSchedule(Authentication authentication,
                              @ModelAttribute TeacherScheduleDTO.Request request,
                              RedirectAttributes redirectAttributes) {
        try {
            Long teacherId = getTeacherId(authentication);
            scheduleService.createSchedule(teacherId, request);
            redirectAttributes.addFlashAttribute("message", "일정이 등록되었습니다.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/teacher/schedule/add";
        } catch (Exception e) {
            log.error("일정 등록 실패: {}", e.getMessage(), e);
            redirectAttributes.addFlashAttribute("error", "일정 등록 중 오류가 발생했습니다: " + e.getMessage());
            return "redirect:/teacher/schedule/add";
        }

        return "redirect:/teacher/schedule";
    }

    /**
     * 일정 수정 폼
     */
    @GetMapping("/edit/{id}")
    public String editForm(@PathVariable Long id,
                           Authentication authentication,
                           Model model,
                           RedirectAttributes redirectAttributes) {
        try {
            Long teacherId = getTeacherId(authentication);
            TeacherScheduleDTO.Response schedule = scheduleService.getSchedule(id, teacherId);

            model.addAttribute("schedule", schedule);
            model.addAttribute("dayOfWeekValues", DayOfWeek.values());
            model.addAttribute("repeatTypeValues", RepeatType.values());

            return "teacher/schedule/edit";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/teacher/schedule";
        } catch (Exception e) {
            log.error("일정 수정 폼 로드 실패: {}", e.getMessage(), e);
            redirectAttributes.addFlashAttribute("error", "일정 정보를 불러오지 못했습니다.");
            return "redirect:/teacher/schedule";
        }
    }

    /**
     * 일정 수정 처리
     */
    @PostMapping("/edit/{id}")
    public String editSchedule(@PathVariable Long id,
                               Authentication authentication,
                               @ModelAttribute TeacherScheduleDTO.Request request,
                               RedirectAttributes redirectAttributes) {
        try {
            Long teacherId = getTeacherId(authentication);
            scheduleService.updateSchedule(id, teacherId, request);
            redirectAttributes.addFlashAttribute("message", "일정이 수정되었습니다.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        } catch (Exception e) {
            log.error("일정 수정 실패: {}", e.getMessage(), e);
            redirectAttributes.addFlashAttribute("error", "일정 수정 중 오류가 발생했습니다: " + e.getMessage());
        }

        return "redirect:/teacher/schedule";
    }

    /**
     * 일정 삭제
     */
    @PostMapping("/delete/{id}")
    public String deleteSchedule(@PathVariable Long id,
                                 Authentication authentication,
                                 RedirectAttributes redirectAttributes) {
        try {
            Long teacherId = getTeacherId(authentication);
            scheduleService.deleteSchedule(id, teacherId);
            redirectAttributes.addFlashAttribute("message", "일정이 삭제되었습니다.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        } catch (Exception e) {
            log.error("일정 삭제 실패: {}", e.getMessage(), e);
            redirectAttributes.addFlashAttribute("error", "일정 삭제 중 오류가 발생했습니다.");
        }

        return "redirect:/teacher/schedule";
    }

    // ── 공통 헬퍼 ──────────────────────────────────────────────────────────────

    private Long getTeacherId(Authentication authentication) {
        Long uid = getUid(authentication);
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        return teacherInfo.getId();
    }

    /**
     * 일반 로그인(AuthUserDTO) / OAuth2 로그인 모두 UID 추출
     */
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
