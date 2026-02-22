package com.example.schoolmate.woo.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.soojin.entity.constant.DayOfWeek;
import com.example.schoolmate.woo.dto.TeacherScheduleDTO;
import com.example.schoolmate.woo.entity.TeacherSchedule;
import com.example.schoolmate.woo.entity.constant.RepeatType;
import com.example.schoolmate.woo.repository.TeacherScheduleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class TeacherScheduleService {

    private final TeacherScheduleRepository scheduleRepository;
    private final TeacherInfoRepository teacherInfoRepository;

    /**
     * 오늘의 일정 조회 (대시보드용)
     */
    public List<TeacherScheduleDTO.Response> getTodaySchedules(Long teacherInfoId) {
        LocalDate today = LocalDate.now();
        DayOfWeek dayOfWeek = convertDayOfWeek(today.getDayOfWeek());

        if (dayOfWeek == null) {
            // 주말인 경우 빈 리스트 반환
            return List.of();
        }

        log.info("오늘의 일정 조회 - teacherInfoId: {}, dayOfWeek: {}, date: {}", teacherInfoId, dayOfWeek, today);
        List<TeacherSchedule> schedules = scheduleRepository.findTodaySchedules(
                teacherInfoId, dayOfWeek, today,
                List.of(RepeatType.WEEKLY, RepeatType.BIWEEKLY),
                RepeatType.ONCE);
        log.info("조회된 일정 수: {}", schedules.size());

        return schedules.stream()
                .map(TeacherScheduleDTO.Response::from)
                .collect(Collectors.toList());
    }

    /**
     * 교사의 전체 일정 조회 (관리 페이지용)
     */
    public List<TeacherScheduleDTO.Response> getAllSchedules(Long teacherInfoId) {
        List<TeacherSchedule> schedules = scheduleRepository
                .findByTeacherIdOrderByDayOfWeekAscPeriodAsc(teacherInfoId);

        return schedules.stream()
                .map(TeacherScheduleDTO.Response::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 요일 일정 조회
     */
    public List<TeacherScheduleDTO.Response> getSchedulesByDay(Long teacherInfoId, DayOfWeek dayOfWeek) {
        List<TeacherSchedule> schedules = scheduleRepository
                .findByTeacherIdAndDayOfWeekOrderByPeriodAsc(teacherInfoId, dayOfWeek);

        return schedules.stream()
                .map(TeacherScheduleDTO.Response::from)
                .collect(Collectors.toList());
    }

    /**
     * 일정 단건 조회
     */
    public TeacherScheduleDTO.Response getSchedule(Long scheduleId, Long teacherInfoId) {
        TeacherSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다. ID: " + scheduleId));

        if (!schedule.getTeacher().getId().equals(teacherInfoId)) {
            throw new IllegalArgumentException("본인의 일정만 조회할 수 있습니다.");
        }

        return TeacherScheduleDTO.Response.from(schedule);
    }

    /**
     * 일정 등록
     */
    @Transactional
    public TeacherScheduleDTO.Response createSchedule(Long teacherInfoId, TeacherScheduleDTO.Request request) {
        TeacherInfo teacher = teacherInfoRepository.findById(teacherInfoId)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        // 같은 요일, 같은 교시 중복 체크 (반복 일정만)
        if (request.getRepeatType() != RepeatType.ONCE) {
            boolean exists = scheduleRepository.existsByTeacherIdAndDayOfWeekAndPeriod(
                    teacherInfoId, request.getDayOfWeek(), request.getPeriod());
            if (exists) {
                throw new IllegalArgumentException(
                        request.getDayOfWeek().getDescription() + " " + request.getPeriod() + "교시에 이미 일정이 있습니다.");
            }
        }

        TeacherSchedule schedule = TeacherSchedule.builder()
                .teacher(teacher)
                .dayOfWeek(request.getDayOfWeek())
                .period(request.getPeriod())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .subjectName(request.getSubjectName())
                .className(request.getClassName())
                .location(request.getLocation())
                .repeatType(request.getRepeatType() != null ? request.getRepeatType() : RepeatType.WEEKLY)
                .specificDate(request.getSpecificDate())
                .memo(request.getMemo())
                .build();

        TeacherSchedule saved = scheduleRepository.save(schedule);
        log.info("일정 등록 완료 - 교사: {}, {}요일 {}교시 {}", teacherInfoId,
                request.getDayOfWeek().getDescription(), request.getPeriod(), request.getSubjectName());

        return TeacherScheduleDTO.Response.from(saved);
    }

    /**
     * 일정 수정
     */
    @Transactional
    public TeacherScheduleDTO.Response updateSchedule(Long scheduleId, Long teacherInfoId,
            TeacherScheduleDTO.Request request) {
        TeacherSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다. ID: " + scheduleId));

        if (!schedule.getTeacher().getId().equals(teacherInfoId)) {
            throw new IllegalArgumentException("본인의 일정만 수정할 수 있습니다.");
        }

        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setPeriod(request.getPeriod());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setSubjectName(request.getSubjectName());
        schedule.setClassName(request.getClassName());
        schedule.setLocation(request.getLocation());
        schedule.setRepeatType(request.getRepeatType() != null ? request.getRepeatType() : RepeatType.WEEKLY);
        schedule.setSpecificDate(request.getSpecificDate());
        schedule.setMemo(request.getMemo());

        log.info("일정 수정 완료 - ID: {}", scheduleId);
        return TeacherScheduleDTO.Response.from(schedule);
    }

    /**
     * 일정 삭제
     */
    @Transactional
    public void deleteSchedule(Long scheduleId, Long teacherInfoId) {
        TeacherSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("일정을 찾을 수 없습니다. ID: " + scheduleId));

        if (!schedule.getTeacher().getId().equals(teacherInfoId)) {
            throw new IllegalArgumentException("본인의 일정만 삭제할 수 있습니다.");
        }

        scheduleRepository.delete(schedule);
        log.info("일정 삭제 완료 - ID: {}", scheduleId);
    }

    /**
     * java.time.DayOfWeek → 프로젝트 DayOfWeek 변환
     */
    private DayOfWeek convertDayOfWeek(java.time.DayOfWeek javaDay) {
        return switch (javaDay) {
            case MONDAY -> DayOfWeek.MONDAY;
            case TUESDAY -> DayOfWeek.TUESDAY;
            case WEDNESDAY -> DayOfWeek.WEDNESDAY;
            case THURSDAY -> DayOfWeek.THURSDAY;
            case FRIDAY -> DayOfWeek.FRIDAY;
            default -> null; // 주말
        };
    }
}
