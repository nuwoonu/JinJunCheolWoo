package com.example.schoolmate.domain.dailysummary.controller;

// [woo] 자녀 하루 요약 API
// 교사: 담임반 학생 목록 조회 + 일일 태그 메모 저장
// 학부모: 자녀 요약 목록/단건 조회
// 관리자: 수동 요약 생성 트리거

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.classroom.repository.ClassroomRepository;
import com.example.schoolmate.domain.dailysummary.dto.DailyNoteRequest;
import com.example.schoolmate.domain.dailysummary.dto.DailySummaryResponse;
import com.example.schoolmate.domain.dailysummary.entity.ChildDailySummary;
import com.example.schoolmate.domain.dailysummary.entity.DailyNote;
import com.example.schoolmate.domain.dailysummary.repository.DailyNoteRepository;
import com.example.schoolmate.domain.dailysummary.service.DailySummaryService;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/daily-summary")
@RequiredArgsConstructor
public class DailySummaryController {

    private final DailySummaryService dailySummaryService;
    private final DailyNoteRepository dailyNoteRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final ClassroomRepository classroomRepository;
    private final StudentInfoRepository studentInfoRepository;

    // ──────────────────────────────────────────────
    // 교사용 API
    // ──────────────────────────────────────────────

    /**
     * [woo] 교사 - 담임반 학생 목록 + 오늘 태그 메모 입력 현황 조회
     * GET /api/daily-summary/teacher/students?date=2026-04-09
     */
    @GetMapping("/teacher/students")
    public ResponseEntity<List<DailySummaryResponse.StudentNoteStatus>> getClassStudents(
            @AuthenticationPrincipal AuthUserDTO userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        if (date == null) date = LocalDate.now(ZoneId.of("Asia/Seoul"));
        final LocalDate finalDate = date;

        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userDetails.getCustomUserDTO().getUid())
                .orElse(null);
        if (teacher == null) return ResponseEntity.ok(List.of());

        Classroom classroom = classroomRepository
                .findByHomeroomTeacherIdAndSchoolYear_Year(teacher.getId(), finalDate.getYear())
                .orElse(null);
        if (classroom == null) return ResponseEntity.ok(List.of());

        List<StudentInfo> students = studentInfoRepository.findByClassroomId(classroom.getCid());

        List<DailySummaryResponse.StudentNoteStatus> result = students.stream()
                .map(s -> {
                    DailyNote note = dailyNoteRepository
                            .findByStudentIdAndNoteDate(s.getId(), finalDate)
                            .orElse(null);
                    return DailySummaryResponse.StudentNoteStatus.builder()
                            .studentId(s.getId())
                            .studentName(s.getUser() != null ? s.getUser().getName() : "-")
                            .tags(note != null && note.getTags() != null
                                    ? List.of(note.getTags().split(","))
                                    : List.of())
                            .memo(note != null ? note.getMemo() : null)
                            .hasNote(note != null)
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * [woo] 교사 - 학생 일일 태그 메모 저장 (없으면 생성, 있으면 덮어씀)
     * POST /api/daily-summary/teacher/note
     */
    @PostMapping("/teacher/note")
    public ResponseEntity<Void> saveNote(
            @RequestBody DailyNoteRequest request,
            @AuthenticationPrincipal AuthUserDTO userDetails) {

        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now(ZoneId.of("Asia/Seoul"));
        StudentInfo student = studentInfoRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        DailyNote note = dailyNoteRepository
                .findByStudentIdAndNoteDate(student.getId(), date)
                .orElse(DailyNote.builder().student(student).noteDate(date).build());

        note.setTags(request.getTags() != null ? String.join(",", request.getTags()) : null);
        note.setMemo(request.getMemo());
        dailyNoteRepository.save(note);

        // [woo] 메모 저장 즉시 GPT 요약 재생성 (비동기 — 교사는 바로 응답 받음)
        dailySummaryService.triggerSummaryAsync(student.getId(), date);

        return ResponseEntity.ok().build();
    }

    /**
     * [woo] 관리자/교사 - 특정 날짜 수동 요약 생성 트리거 (전체)
     * POST /api/daily-summary/trigger?date=2026-04-09
     */
    @PostMapping("/trigger")
    public ResponseEntity<String> triggerSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now(ZoneId.of("Asia/Seoul"));
        dailySummaryService.generateAllSummaries(date);
        return ResponseEntity.ok("요약 생성 완료: " + date);
    }

    /**
     * [woo] 교사 - 특정 학생 즉시 요약 생성 (발표·데모·수동 재생성용)
     * POST /api/daily-summary/trigger/student/{studentId}?date=2026-04-09
     * 이미 생성된 경우 덮어쓰기 (강제 재생성)
     */
    @PostMapping("/trigger/student/{studentId}")
    public ResponseEntity<DailySummaryResponse.Summary> triggerStudentSummary(
            @PathVariable Long studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        if (date == null) date = LocalDate.now(ZoneId.of("Asia/Seoul"));
        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        // 기존 요약 삭제 후 재생성 (강제)
        dailySummaryService.regenerateSummaryForStudent(student, date);

        return dailySummaryService.getSummary(studentId, date)
                .map(s -> ResponseEntity.ok(DailySummaryResponse.Summary.builder()
                        .id(s.getId())
                        .studentId(studentId)
                        .summaryDate(s.getSummaryDate())
                        .content(s.getContent())
                        .build()))
                .orElse(ResponseEntity.noContent().build());
    }

    // ──────────────────────────────────────────────
    // 학부모용 API
    // ──────────────────────────────────────────────

    /**
     * [woo] 학부모 - 자녀의 하루 요약 목록 (최신순)
     * GET /api/daily-summary/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<DailySummaryResponse.Summary>> getSummaries(
            @PathVariable Long studentId) {

        List<ChildDailySummary> summaries = dailySummaryService.getSummariesForStudent(studentId);
        List<DailySummaryResponse.Summary> result = summaries.stream()
                .map(s -> DailySummaryResponse.Summary.builder()
                        .id(s.getId())
                        .studentId(studentId)
                        .summaryDate(s.getSummaryDate())
                        .content(s.getContent())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * [woo] 학부모 - 특정 날짜 요약 단건
     * GET /api/daily-summary/student/{studentId}/date/2026-04-09
     */
    @GetMapping("/student/{studentId}/date/{date}")
    public ResponseEntity<DailySummaryResponse.Summary> getSummaryByDate(
            @PathVariable Long studentId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return dailySummaryService.getSummary(studentId, date)
                .map(s -> ResponseEntity.ok(DailySummaryResponse.Summary.builder()
                        .id(s.getId())
                        .studentId(studentId)
                        .summaryDate(s.getSummaryDate())
                        .content(s.getContent())
                        .build()))
                .orElse(ResponseEntity.noContent().build());
    }
}
