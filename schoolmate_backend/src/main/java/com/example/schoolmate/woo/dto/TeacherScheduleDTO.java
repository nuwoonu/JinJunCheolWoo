package com.example.schoolmate.woo.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.format.annotation.DateTimeFormat;

import com.example.schoolmate.soojin.entity.constant.DayOfWeek;
import com.example.schoolmate.woo.entity.TeacherSchedule;
import com.example.schoolmate.woo.entity.constant.RepeatType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class TeacherScheduleDTO {

    /**
     * 일정 등록/수정 요청 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private DayOfWeek dayOfWeek;
        private Integer period;
        // [woo] HTML <input type="time">이 "HH:mm" 형식으로 전송 → 바인딩 명시
        @DateTimeFormat(pattern = "HH:mm")
        private LocalTime startTime;
        @DateTimeFormat(pattern = "HH:mm")
        private LocalTime endTime;
        private String subjectName;
        private String className;
        private String location;
        private RepeatType repeatType;
        // [woo] HTML <input type="date">이 "yyyy-MM-dd" 형식으로 전송 → 바인딩 명시
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate specificDate;
        private String memo;
    }

    /**
     * 일정 응답 DTO
     */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private DayOfWeek dayOfWeek;
        private String dayOfWeekDescription;
        private Integer period;
        private LocalTime startTime;
        private LocalTime endTime;
        private String subjectName;
        private String className;
        private String location;
        private RepeatType repeatType;
        private String repeatTypeDescription;
        private LocalDate specificDate;
        private String memo;

        public static Response from(TeacherSchedule entity) {
            return Response.builder()
                    .id(entity.getId())
                    .dayOfWeek(entity.getDayOfWeek())
                    .dayOfWeekDescription(entity.getDayOfWeek().getDescription())
                    .period(entity.getPeriod())
                    .startTime(entity.getStartTime())
                    .endTime(entity.getEndTime())
                    .subjectName(entity.getSubjectName())
                    .className(entity.getClassName())
                    .location(entity.getLocation())
                    .repeatType(entity.getRepeatType())
                    .repeatTypeDescription(entity.getRepeatType().getDescription())
                    .specificDate(entity.getSpecificDate())
                    .memo(entity.getMemo())
                    .build();
        }
    }
}
