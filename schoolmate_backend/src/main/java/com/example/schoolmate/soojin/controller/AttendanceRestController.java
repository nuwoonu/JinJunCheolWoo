package com.example.schoolmate.soojin.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.soojin.dto.AttendanceDTO;
import com.example.schoolmate.soojin.service.AttendanceService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [woo] 출결 관리 REST API
 * - 학생 출결: 교사/관리자가 조회·변경
 * - 교사 출결: 관리자가 조회·변경
 * - 학부모: 자녀 출결 요약/상세 조회
 */
@Slf4j
@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceRestController {

    private final AttendanceService attendanceService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final TeacherService teacherService;

    // ========== [woo] 교사 담임 반 정보 ==========

    /**
     * GET /api/attendance/student/myclass
     * 교사의 담임 반 정보 반환 (학년, 반)
     * TeacherService.getMyClassroom() 재사용 (나의 학급과 동일 로직)
     */
    @GetMapping("/student/myclass")
    public ResponseEntity<?> getMyClassInfo(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long teacherUid = authUser.getCustomUserDTO().getUid();
        int currentYear = LocalDate.now().getYear();

        // [woo] TeacherInfo.id를 구해서 TeacherService 사용 (나의 학급과 동일)
        var teacherOpt = teacherInfoRepository.findByUserUid(teacherUid);
        if (teacherOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of());
        }

        return teacherService.getMyClassroom(teacherOpt.get().getId(), currentYear)
                .map(classroom -> ResponseEntity.ok(Map.of(
                        "grade", classroom.getGrade(),
                        "classNum", classroom.getClassNum()
                )))
                .orElse(ResponseEntity.ok(Map.of()));
    }

    // ========== [woo] 학생 출결 (담당 교사) ==========

    /**
     * GET /api/attendance/student?date=2026-03-17
     * [woo] 담임 반 학생 출결 목록 조회 (기록 없는 학생은 "미처리"로 표시)
     */
    @GetMapping("/student")
    public ResponseEntity<?> getStudentAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Long teacherUid = authUser.getCustomUserDTO().getUid();

        try {
            List<AttendanceDTO.StudentAttendanceResponse> list =
                    attendanceService.getStudentAttendanceByTeacher(teacherUid, date);

            return ResponseEntity.ok(list);
        } catch (Exception e) {
            log.error("[woo] 학생 출결 조회 실패 - teacherUid: {}, date: {}, error: {}", teacherUid, date, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/attendance/student/update
     * [woo] 개별 학생 출결 상태 변경 (studentInfoId 기반 - 기록 없으면 생성)
     */
    @PutMapping("/student/update")
    public ResponseEntity<?> updateStudentAttendance(
            @RequestParam Long studentInfoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody AttendanceDTO.StatusUpdateRequest request) {
        try {
            attendanceService.updateStudentAttendanceByStudentInfo(
                    studentInfoId, date, request.getStatus(), request.getReason());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("[woo] 출결 변경 실패 - studentInfoId: {}, error: {}", studentInfoId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/attendance/student/all-present
     * [woo] 전원출석 버튼 - 담임 반 전체를 출석 처리
     */
    @PostMapping("/student/all-present")
    public ResponseEntity<?> markAllPresent(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long teacherUid = authUser.getCustomUserDTO().getUid();
            int count = attendanceService.markAllPresent(teacherUid, date);
            return ResponseEntity.ok(Map.of("message", count + "명 전원 출석 처리 완료"));
        } catch (Exception e) {
            log.error("[woo] 전원출석 실패 - error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== [woo] 교사 출결 (관리자) ==========

    /**
     * GET /api/attendance/teacher?date=2026-03-17
     * 교사 출결 목록 조회
     */
    @GetMapping("/teacher")
    public ResponseEntity<List<AttendanceDTO.TeacherAttendanceResponse>> getTeacherAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Long schoolId = authUser.getCustomUserDTO().getSchoolId();
        if (schoolId == null) {
            return ResponseEntity.badRequest().build();
        }

        // [woo] 해당 날짜에 출결 기록이 없으면 자동 초기화
        attendanceService.initializeDailyTeacherAttendance(schoolId, date);

        List<AttendanceDTO.TeacherAttendanceResponse> list =
                attendanceService.getTeacherAttendanceList(schoolId, date);

        return ResponseEntity.ok(list);
    }

    /**
     * PUT /api/attendance/teacher/{id}
     * 교사 출결 상태 변경
     */
    @PutMapping("/teacher/{id}")
    public ResponseEntity<?> updateTeacherAttendance(
            @PathVariable Long id,
            @RequestBody AttendanceDTO.StatusUpdateRequest request) {
        try {
            attendanceService.updateTeacherAttendanceStatus(id, request.getStatus(), request.getReason());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 교사용 이번 달 출결 처리 일수 ==========

    /**
     * GET /api/attendance/student/processed-days
     * 이번 달 출결 처리 완료한 일수
     */
    @GetMapping("/student/processed-days")
    public ResponseEntity<?> getProcessedDays(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long teacherUid = authUser.getCustomUserDTO().getUid();
        LocalDate now = LocalDate.now();
        LocalDate startDate = now.withDayOfMonth(1);
        long days = attendanceService.getProcessedDaysCount(teacherUid, startDate, now);
        return ResponseEntity.ok(Map.of("processedDays", days, "currentDay", now.getDayOfMonth()));
    }

    // ========== [woo] 학생 본인 출결 요약 (사이드바용) ==========

    /**
     * GET /api/attendance/my/summary
     * 학생 본인의 이번 달 출결 통계
     */
    @GetMapping("/my/summary")
    public ResponseEntity<?> getMyAttendanceSummary(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long studentInfoId = authUser.getCustomUserDTO().getStudentInfoId();
        if (studentInfoId == null) {
            return ResponseEntity.badRequest().body("학생 정보가 없습니다.");
        }

        LocalDate now = LocalDate.now();
        LocalDate startDate = now.withDayOfMonth(1);
        LocalDate endDate = now;

        // [woo] 반환 타입 Map<String, Object> (totalDays 포함)
        Map<String, Object> statusCounts = attendanceService.getMyAttendanceSummary(
                studentInfoId, startDate, endDate);

        return ResponseEntity.ok(statusCounts);
    }

    // ========== [woo] 학부모 자녀 출결 조회 ==========

    /**
     * GET /api/attendance/parent/summary?startDate=2026-03-01&endDate=2026-03-31
     * 학부모의 모든 자녀 출결 요약
     */
    @GetMapping("/parent/summary")
    public ResponseEntity<List<AttendanceDTO.ChildAttendanceSummary>> getChildrenSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Long parentUid = authUser.getCustomUserDTO().getUid();
        List<AttendanceDTO.ChildAttendanceSummary> summaries =
                attendanceService.getChildrenAttendanceSummary(parentUid, startDate, endDate);

        return ResponseEntity.ok(summaries);
    }

    /**
     * GET /api/attendance/parent/children/{studentInfoId}?startDate=...&endDate=...
     * 특정 자녀의 출결 상세 기록
     */
    @GetMapping("/parent/children/{studentInfoId}")
    public ResponseEntity<?> getChildAttendanceRecords(
            @PathVariable Long studentInfoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long parentUid = authUser.getCustomUserDTO().getUid();
            List<AttendanceDTO.ChildAttendanceRecord> records =
                    attendanceService.getChildAttendanceRecords(parentUid, studentInfoId, startDate, endDate);
            return ResponseEntity.ok(records);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
