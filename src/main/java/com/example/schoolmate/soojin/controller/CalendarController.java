package com.example.schoolmate.soojin.controller;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.schoolmate.common.dto.dashboardinfo.SchoolCalendarDTO;
import com.example.schoolmate.soojin.entity.constant.EventType;
import com.example.schoolmate.soojin.service.CalendarService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Log4j2
@RequestMapping("/soojin")
@RequiredArgsConstructor
@Controller
public class CalendarController {
    private final CalendarService calendarService;

    // 읽기 전용

    @GetMapping("/calendar/monthly")
    public String monthlyView(
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "grade", required = false) Integer grade,
            Model model) {

        LocalDate now = LocalDate.now();
        if (year == null)
            year = now.getYear();
        if (month == null)
            month = now.getMonthValue();

        List<SchoolCalendarDTO> events = calendarService.getMonthlyCalendar(year, month, grade);

        model.addAttribute("events", events);
        model.addAttribute("year", year);
        model.addAttribute("month", month);

        return "soojin/calendar/monthly";
    }

    @GetMapping("/calendar/list")
    public String listView(
            @RequestParam(value = "start", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(value = "grade", required = false) Integer grade,
            @RequestParam(value = "eventType", required = false) EventType eventType,
            Model model) {
        if (start == null) {
            start = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
        }
        if (end == null) {
            end = LocalDate.now().with(TemporalAdjusters.lastDayOfMonth());
        }

        List<SchoolCalendarDTO> events = calendarService.getEventList(start, end, grade, eventType);
        model.addAttribute("events", events);
        model.addAttribute("eventTypes", EventType.values());
        return "soojin/calendar/list";
    }

    // API (AJAX용) - 페이지 새로고침 없이 데이터 주고 받음
    @GetMapping("/api/events")
    @ResponseBody
    public List<SchoolCalendarDTO> getEvents(
            @RequestParam("year") int year,
            @RequestParam("month") int month,
            @RequestParam(value = "grade", required = false) Integer grade) {
        return calendarService.getMonthlyCalendar(year, month, grade);
    }

    // ✅ 관리 (관리자 전용) - 경로 수정해야함
    // @PreAuthorize("hasRole('ADMIN')")
    // @GetMapping("/admin/add")
    // public String addEvent(Model model) {
    // model.addAttribute("eventTypes", EventType.values());
    // return "calendar/admin/add";
    // }

    // @PreAuthorize("hasRole('ADMIN')")
    // @PostMapping("/admin/add")
    // public String addEvent(@ModelAttribute SchoolCalendarDTO dto,
    // RedirectAttributes rttr) {
    // calendarService.insertCalendar(dto);
    // rttr.addFlashAttribute("msg", "일정이 등록되었습니다.");
    // return "redirect:/soojin/list";
    // }

    // @PreAuthorize("hasRole('ADMIN')")
    // @GetMapping("/admin/edit/{id}")
    // public String editEvent(@PathVariable Long id, Model model) {
    // SchoolCalendarDTO event = calendarService.getRow(id); // ← 기존 데이터 조회
    // model.addAttribute("event", event); // ← 화면에 전달
    // model.addAttribute("eventTypes", EventType.values());
    // return "calendar/admin/edit";
    // }

    // @PreAuthorize("hasRole('ADMIN')")
    // @PostMapping("/admin/update")
    // public String updateEvent(@ModelAttribute SchoolCalendarDTO dto,
    // RedirectAttributes rttr) {
    // calendarService.updateCalendar(dto);
    // rttr.addFlashAttribute("msg", "일정이 수정되었습니다.");
    // return "redirect:/soojin/list";
    // }

    // @PreAuthorize("hasRole('ADMIN')")
    // @PostMapping("/admin/delete/{id}")
    // public String deleteEvent(@PathVariable Long id, RedirectAttributes rttr) {
    // calendarService.deleteCalendar(id);
    // rttr.addFlashAttribute("msg", "일정이 삭제되었습니다.");
    // return "redirect:/soojin/list";
    // }

}
