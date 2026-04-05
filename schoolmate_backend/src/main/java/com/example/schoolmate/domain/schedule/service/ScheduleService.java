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
import com.example.schoolmate.global.util.NotificationHelper;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.calendar.entity.SchoolCalendar;
import com.example.schoolmate.domain.calendar.entity.constant.EventType;
import com.example.schoolmate.domain.calendar.repository.SchoolCalendarRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.domain.staff.repository.StaffInfoRepository;
import com.opencsv.bean.CsvToBeanBuilder;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleService {

    private final SchoolCalendarRepository schoolCalendarRepository;
    private final SchoolRepository schoolRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StaffInfoRepository staffInfoRepository;
    private final StudentInfoRepository studentInfoRepository;

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

        Long savedId = schoolCalendarRepository.save(event).getId();

        // 학교 구성원에게 일정 등록 알림
        if (schoolId != null) {
            notifySchoolMembers(schoolId, "새 학사 일정 등록",
                    "'" + request.getTitle() + "' 일정이 등록되었습니다.", "/schedule");
        }

        return savedId;
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

        // 학교 구성원에게 일정 변경 알림
        Long schoolId = event.getSchool() != null ? event.getSchool().getId() : null;
        if (schoolId != null) {
            notifySchoolMembers(schoolId, "학사 일정 변경",
                    "'" + request.getTitle() + "' 일정이 변경되었습니다.", "/schedule");
        }
    }

    public void deleteEvent(Long id) {
        SchoolCalendar event = schoolCalendarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다."));

        Long schoolId = event.getSchool() != null ? event.getSchool().getId() : null;
        String eventTitle = event.getTitle();

        schoolCalendarRepository.deleteById(id);

        // 학교 구성원에게 일정 취소 알림
        if (schoolId != null) {
            notifySchoolMembers(schoolId, "학사 일정 취소",
                    "'" + eventTitle + "' 일정이 취소되었습니다.", "/schedule");
        }
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

    private void notifySchoolMembers(Long schoolId, String title, String content, String actionUrl) {
        teacherInfoRepository.findBySchoolId(schoolId).stream()
                .map(info -> info.getUser()).filter(u -> u != null)
                .forEach(u -> NotificationHelper.send(u, title, content, actionUrl));
        staffInfoRepository.findBySchoolId(schoolId).stream()
                .map(info -> info.getUser()).filter(u -> u != null)
                .forEach(u -> NotificationHelper.send(u, title, content, actionUrl));
        studentInfoRepository.findBySchoolId(schoolId).stream()
                .map(info -> info.getUser()).filter(u -> u != null)
                .forEach(u -> NotificationHelper.send(u, title, content, actionUrl));
    }
}