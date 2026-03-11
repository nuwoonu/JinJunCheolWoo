package com.example.schoolmate.soojin.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.dto.dashboardinfo.SchoolCalendarDTO;
import com.example.schoolmate.common.dto.dashboardinfo.TimetableItemDTO;
import com.example.schoolmate.soojin.service.NeisCalendarService;

import lombok.RequiredArgsConstructor;

// [woo] /api/calendar - NEIS API 실시간 연동으로 학교일정 반환
@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarRestController {

    private final NeisCalendarService neisCalendarService;

    // GET /api/calendar/events?year=2025&month=3&grade=1(optional)
    @GetMapping("/events")
    public ResponseEntity<List<SchoolCalendarDTO>> getEvents(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Integer grade) {
        List<SchoolCalendarDTO> events = neisCalendarService.getMonthlyEvents(year, month, grade);
        return ResponseEntity.ok(events);
    }

    // [woo] GET /api/calendar/timetable?grade=1&classNum=1 - 오늘 시간표 (NEIS hisTimetable)
    @GetMapping("/timetable")
    public ResponseEntity<List<TimetableItemDTO>> getTimetable(
            @RequestParam int grade,
            @RequestParam int classNum) {
        List<TimetableItemDTO> timetable = neisCalendarService.getTodayTimetable(grade, classNum);
        return ResponseEntity.ok(timetable);
    }
}
