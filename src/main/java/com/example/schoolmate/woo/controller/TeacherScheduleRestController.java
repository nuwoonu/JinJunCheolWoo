package com.example.schoolmate.woo.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.soojin.entity.constant.DayOfWeek;
import com.example.schoolmate.woo.dto.TeacherScheduleDTO;
import com.example.schoolmate.common.service.TeacherScheduleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * [woo] 수업 일정 REST API - React 시간표 위젯 연동용
 */
@RestController
@RequestMapping("/api/teacher/schedule")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
@Log4j2
public class TeacherScheduleRestController {

    private final TeacherScheduleService scheduleService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final UserRepository userRepository;

    /**
     * 전체 일정 조회 (React 시간표 초기 로딩용)
     */
    @GetMapping
    public ResponseEntity<List<TeacherScheduleDTO.Response>> getSchedules(Authentication authentication) {
        Long teacherId = getTeacherId(authentication);
        List<TeacherScheduleDTO.Response> schedules = scheduleService.getAllSchedules(teacherId);
        log.info("[REST] 일정 조회 - teacherId: {}, 건수: {}", teacherId, schedules.size());
        return ResponseEntity.ok(schedules);
    }

    /**
     * [woo] 오늘의 일정 조회 (대시보드 React 위젯용)
     * - 평일: 오늘 요일 일정 반환
     * - 주말: 다음 월요일 예정 일정 반환
     */
    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodaySchedules(Authentication authentication) {
        Long teacherId = getTeacherId(authentication);
        java.time.DayOfWeek javaToday = LocalDate.now().getDayOfWeek();
        boolean isWeekend = (javaToday == java.time.DayOfWeek.SATURDAY
                || javaToday == java.time.DayOfWeek.SUNDAY);

        List<TeacherScheduleDTO.Response> schedules;
        String label;
        if (isWeekend) {
            schedules = scheduleService.getSchedulesByDay(teacherId, DayOfWeek.MONDAY);
            label = "월요일 예정 일정";
        } else {
            schedules = scheduleService.getTodaySchedules(teacherId);
            label = "오늘의 수업 일정";
        }
        log.info("[REST] 오늘 일정 조회 - teacherId: {}, label: {}, 건수: {}", teacherId, label, schedules.size());
        return ResponseEntity.ok(Map.of("label", label, "schedules", schedules));
    }

    /**
     * [woo] 일정 등록 (대시보드 React 위젯 추가 모달용)
     */
    @PostMapping
    public ResponseEntity<TeacherScheduleDTO.Response> createSchedule(
            @RequestBody TeacherScheduleDTO.Request request,
            Authentication authentication) {
        Long teacherId = getTeacherId(authentication);
        TeacherScheduleDTO.Response created = scheduleService.createSchedule(teacherId, request);
        log.info("[REST] 일정 등록 완료 - teacherId: {}", teacherId);
        return ResponseEntity.ok(created);
    }

    /**
     * [woo] 일정 수정 (대시보드 React 위젯 수정 모달용)
     */
    @PutMapping("/{id}")
    public ResponseEntity<TeacherScheduleDTO.Response> updateSchedule(
            @PathVariable Long id,
            @RequestBody TeacherScheduleDTO.Request request,
            Authentication authentication) {
        Long teacherId = getTeacherId(authentication);
        TeacherScheduleDTO.Response updated = scheduleService.updateSchedule(id, teacherId, request);
        log.info("[REST] 일정 수정 완료 - id: {}", id);
        return ResponseEntity.ok(updated);
    }

    /**
     * 일정 삭제 (React에서 DELETE fetch 호출)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id, Authentication authentication) {
        Long teacherId = getTeacherId(authentication);
        scheduleService.deleteSchedule(id, teacherId);
        log.info("[REST] 일정 삭제 완료 - id: {}", id);
        return ResponseEntity.noContent().build();
    }

    // ── 공통 헬퍼 ──────────────────────────────────────────────────────────

    private Long getTeacherId(Authentication authentication) {
        Long uid = getUid(authentication);
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        return teacherInfo.getId();
    }

    /**
     * [woo] 일반 로그인(AuthUserDTO) / OAuth2 로그인 모두 UID 추출
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
