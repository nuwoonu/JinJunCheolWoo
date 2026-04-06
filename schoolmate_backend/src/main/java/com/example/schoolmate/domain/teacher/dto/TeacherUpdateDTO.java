package com.example.schoolmate.domain.teacher.dto;

import com.example.schoolmate.domain.teacher.entity.constant.TeacherStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 교사 정보 수정용 DTO
// null이면 해당 필드 수정 안함
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherUpdateDTO {

    private String subject;

    private String department;

    private String position;

    private TeacherStatus status;
}
