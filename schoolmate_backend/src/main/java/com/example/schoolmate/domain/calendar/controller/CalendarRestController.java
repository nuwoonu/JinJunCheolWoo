package com.example.schoolmate.domain.calendar.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.dashboard.dto.SchoolCalendarDTO;
import com.example.schoolmate.domain.dashboard.dto.TimetableItemDTO;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.calendar.service.NeisCalendarService;

import lombok.RequiredArgsConstructor;

// [woo] /api/calendar - NEIS API 실시간 연동으로 학교일정/시간표 반환
// [woo] 학교별 구분: schoolId → School DB → officeCode/schoolCode/schoolKind → NEIS 호출
@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarRestController {

    private final NeisCalendarService neisCalendarService;
    private final SchoolRepository schoolRepository;

    // [woo] GET /api/calendar/events?year=2025&month=3[&grade=1][&schoolId=N]
    // schoolId 없으면 JWT 컨텍스트(SchoolContextHolder)에서 자동 조회
    @GetMapping("/events")
    public ResponseEntity<List<SchoolCalendarDTO>> getEvents(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Integer grade,
            @RequestParam(required = false) Long schoolId) {

        School school = resolveSchool(schoolId);
        if (school == null || school.getOfficeCode() == null || school.getSchoolCode() == null) {
            return ResponseEntity.ok(List.of());
        }

        List<SchoolCalendarDTO> events = neisCalendarService.getMonthlyEvents(
                year, month, grade, school.getOfficeCode(), school.getSchoolCode());
        return ResponseEntity.ok(events);
    }

    // [woo] GET /api/calendar/timetable?grade=1&classNum=1&schoolId=N
    // [soojin] schoolId: 학부모처럼 JWT 컨텍스트에 schoolId 없을 때 자녀 schoolId를 직접 전달
    @GetMapping("/timetable")
    public ResponseEntity<List<TimetableItemDTO>> getTimetable(
            @RequestParam int grade,
            @RequestParam int classNum,
            @RequestParam(required = false) Long schoolId) {

        School school = resolveSchool(schoolId);
        if (school == null || school.getOfficeCode() == null || school.getSchoolCode() == null) {
            return ResponseEntity.ok(List.of());
        }

        List<TimetableItemDTO> timetable = neisCalendarService.getTodayTimetable(
                grade, classNum, school.getOfficeCode(), school.getSchoolCode(), school.getSchoolKind());
        return ResponseEntity.ok(timetable);
    }

    // [woo] schoolId 파라미터 우선, 없으면 JWT 컨텍스트(SchoolContextHolder) 사용
    private School resolveSchool(Long schoolId) {
        Long id = (schoolId != null) ? schoolId : SchoolContextHolder.getSchoolId();
        if (id == null) return null;
        return schoolRepository.findById(id).orElse(null);
    }
}
