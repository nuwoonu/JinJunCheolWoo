package com.example.schoolmate.common.dto.dashboardinfo;

import com.example.schoolmate.soojin.entity.constant.DayOfWeek;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTimetableDTO {

    // 오늘의 시간표, 전체 시간표

    private Long id;

    private Integer schoolYear;

    // private Integer semester; 

    // private Integer grade; // 학년

    // private Integer classNum; // 반

    private DayOfWeek dayOfWeek; // 요일

    private Integer period; // 교시

    // private String subject; // 과목

    private String teacherName; // 담당 선생님 이름 (Teacher에서 추출) >> TeacherInfo teacher?
}
