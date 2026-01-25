package com.example.schoolmate.soojin.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.dashboardinfo.SchoolCalendarDTO;
import com.example.schoolmate.soojin.entity.SchoolCalendar;
import com.example.schoolmate.soojin.entity.constant.EventType;
import com.example.schoolmate.soojin.repository.CalendarRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Transactional
@Log4j2
@Service
@RequiredArgsConstructor
public class CalendarService {
    private final CalendarRepository calendarRepository;

    // ✅ 조회 (모든 사용자 - 관리자, 선생님, 학생)

    // 1. 캘린더 형식 - 월별 일정 조회
    @Transactional(readOnly = true)
    public List<SchoolCalendarDTO> getMonthlyCalendar(int year, int month, Integer grade) {
        log.info("월별 일정 조회: {}년 {}월, 학년: {}", year, month, grade);

        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());

        List<SchoolCalendar> events = (grade != null)
                ? calendarRepository.findByMonthAndGrade(startOfMonth, endOfMonth, grade)
                : calendarRepository.findByMonth(startOfMonth, endOfMonth);

        return events.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // 2. 목록 형식 - 기간별 일정 조회
    @Transactional(readOnly = true)
    public List<SchoolCalendarDTO> getEventList(LocalDate start, LocalDate end,
            Integer grade, EventType eventType) {
        log.info("일정 목록 조회: {} ~ {}, 학년: {}, 행사유형: {}", start, end, grade, eventType);

        List<SchoolCalendar> events = calendarRepository.findByMonth(start, end);

        return events.stream()
                .filter(e -> grade == null || e.getTargetGrade() == null || e.getTargetGrade().equals(grade))
                .filter(e -> eventType == null || e.getEventType() == eventType)
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // 3. 다가오는 일정 조회 (대시보드용) - upcomingEvent
    @Transactional(readOnly = true)
    public List<SchoolCalendarDTO> getUpcomingEvents(int limit) {
        log.info("다가오는 일정 {} 건 조회", limit);

        return calendarRepository.findByStartDateGreaterThanEqualOrderByStartDateAsc(LocalDate.now())
                .stream()
                .limit(limit)
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // ✅ 일정 데이터 C U D (관리자용)
    // 1. 일정 등록
    // (하나씩 추가 / 일정 파일 전체 업로드)
    @PreAuthorize("hasRole('ADMIN')")
    public Long insertCalendar(SchoolCalendarDTO dto) {
        log.info("일정 등록: {}", dto);

        SchoolCalendar calendar = SchoolCalendar.builder()
                .title(dto.getTitle())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .eventType(dto.getEventType())
                .targetGrade(dto.getTargetGrade())
                .description(dto.getDescription())
                .build();

        return calendarRepository.save(calendar).getId();

    }

    // 2. 일정 수정
    // 수정할 일정 조회 - 기존 데이터 조회
    @Transactional(readOnly = true)
    public SchoolCalendarDTO getRow(Long id) {
        log.info("일정 단건 조회: {}", id);

        SchoolCalendar calendar = calendarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다."));

        return entityToDto(calendar);
    }

    // 엔티티 조회 후, 찾아서 변경
    @PreAuthorize("hasRole('ADMIN')")
    public void updateCalendar(SchoolCalendarDTO dto) {
        log.info("일정 수정: {}", dto);

        SchoolCalendar calendar = calendarRepository.findById(dto.getId())
                .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다."));

        calendar.changeTitle(dto.getTitle());
        calendar.changeStartDate(dto.getStartDate());
        calendar.changeEndDate(dto.getEndDate());
        calendar.changeEventType(dto.getEventType());
        calendar.changeTargetGrade(dto.getTargetGrade());
        calendar.changeDescription(dto.getDescription());
    }

    // 3. 일정 삭제
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCalendar(Long id) {
        log.info("일정 삭제: {}", id);
        calendarRepository.deleteById(id);
    }

    // 000행사 | 00/00(0) ~ 00/00(0) | D-00
    // entityToDto
    private SchoolCalendarDTO entityToDto(SchoolCalendar schoolCalendar) {

        SchoolCalendarDTO schoolCalendarDTO = SchoolCalendarDTO.builder()
                .id(schoolCalendar.getId())
                .title(schoolCalendar.getTitle())
                .startDate(schoolCalendar.getStartDate())
                .endDate(schoolCalendar.getEndDate())
                .eventType(schoolCalendar.getEventType())
                .targetGrade(schoolCalendar.getTargetGrade())
                .description(schoolCalendar.getDescription())
                .dDay(calculateDDay(schoolCalendar.getStartDate()))
                .dateRangeText(formatDateRange(schoolCalendar.getStartDate(), schoolCalendar.getEndDate()))
                .build();

        return schoolCalendarDTO;
    }

    // D-day
    private Integer calculateDDay(LocalDate eventDate) {
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), eventDate);
    }

    // 화면용 날짜 형식 00/00(0) ~ 00/00(0)
    private String formatDateRange(LocalDate start, LocalDate end) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M/d(E)", Locale.KOREAN);
        String startText = start.format(formatter);

        if (end == null || end.equals(start)) {
            return startText;
        }
        return startText + " ~ " + end.format(formatter);
    }

}
