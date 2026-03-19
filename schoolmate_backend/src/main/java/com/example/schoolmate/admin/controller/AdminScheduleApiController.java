package com.example.schoolmate.admin.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.dto.SchoolCalendarDTO;
import com.example.schoolmate.common.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;

@Slf4j
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_SCHEDULE)
@RequiredArgsConstructor
@PreAuthorize("@grants.canManageSchedule()")
public class AdminScheduleApiController {

    private final ScheduleService adminScheduleService;

    @GetMapping
    public ResponseEntity<List<SchoolCalendarDTO.Response>> getEvents(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        // FullCalendar가 보내는 시간 포함 ISO 포맷을 받아서 LocalDate로 변환
        return ResponseEntity.ok(adminScheduleService.getEvents(start.toLocalDate(), end.toLocalDate()));
    }

    @PostMapping
    public ResponseEntity<Long> createEvent(@RequestBody SchoolCalendarDTO.Request request) {
        return ResponseEntity.ok(adminScheduleService.createEvent(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateEvent(@PathVariable Long id, @RequestBody SchoolCalendarDTO.Request request) {
        adminScheduleService.updateEvent(id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        adminScheduleService.deleteEvent(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/import-csv")
    public ResponseEntity<String> importCsv(@RequestParam("file") MultipartFile file) {
        try {
            adminScheduleService.importScheduleFromCsv(file);
            return ResponseEntity.ok("일정이 일괄 등록되었습니다.");
        } catch (Exception e) {
            log.error("학사 일정 CSV 가져오기 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("오류: " + e.getMessage());
        }
    }
}