package com.example.schoolmate.domain.schedule.service;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.domain.calendar.dto.SchoolCalendarDTO;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.calendar.entity.SchoolCalendar;
import com.example.schoolmate.domain.calendar.entity.constant.EventType;
import com.example.schoolmate.domain.calendar.repository.SchoolCalendarRepository;
import com.opencsv.bean.CsvToBeanBuilder;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleService {

    private final SchoolCalendarRepository schoolCalendarRepository;
    private final SchoolRepository schoolRepository;

    @Transactional(readOnly = true)
    public List<SchoolCalendarDTO.Response> getEvents(LocalDate start, LocalDate end) {
        return getEvents(start, end, null);
    }

    @Transactional(readOnly = true)
    public List<SchoolCalendarDTO.Response> getEvents(LocalDate start, LocalDate end, Long schoolId) {
        List<SchoolCalendar> events = schoolId != null
                ? schoolCalendarRepository.findOverlappingEventsBySchool(start, end, schoolId)
                : schoolCalendarRepository.findOverlappingEvents(start, end);
        return events.stream()
                .map(SchoolCalendarDTO.Response::from)
                .collect(Collectors.toList());
    }

    public Long createEvent(SchoolCalendarDTO.Request request) {
        SchoolCalendar event = SchoolCalendar.builder()
                .title(request.getTitle())
                .startDate(request.getStart())
                .endDate(request.getEnd()) // 종료일이 없으면 null
                .eventType(EventType.valueOf(request.getEventType()))
                .targetGrade(request.getTargetGrade())
                .description(request.getDescription())
                .build();

        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(event::setSchool);
        }

        return schoolCalendarRepository.save(event).getId();
    }

    public void updateEvent(Long id, SchoolCalendarDTO.Request request) {
        SchoolCalendar event = schoolCalendarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다."));

        event.update(
                request.getTitle(),
                request.getStart(),
                request.getEnd(),
                EventType.valueOf(request.getEventType()),
                request.getTargetGrade(),
                request.getDescription());
    }

    public void deleteEvent(Long id) {
        if (!schoolCalendarRepository.existsById(id)) {
            throw new IllegalArgumentException("일정을 찾을 수 없습니다.");
        }
        schoolCalendarRepository.deleteById(id);
    }

    public void importScheduleFromCsv(MultipartFile file) throws Exception {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            List<SchoolCalendarDTO.CsvImportRequest> beans = new CsvToBeanBuilder<SchoolCalendarDTO.CsvImportRequest>(
                    reader)
                    .withType(SchoolCalendarDTO.CsvImportRequest.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();

            for (SchoolCalendarDTO.CsvImportRequest csvReq : beans) {
                SchoolCalendarDTO.Request request = SchoolCalendarDTO.Request.builder()
                        .title(csvReq.getTitle())
                        .start(csvReq.getStart())
                        .end(csvReq.getEnd())
                        .eventType(csvReq.getEventType() != null ? csvReq.getEventType().trim() : null)
                        .targetGrade(csvReq.getTargetGrade())
                        .description(csvReq.getDescription())
                        .build();
                createEvent(request);
            }
        }
    }
}