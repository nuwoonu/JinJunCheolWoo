package com.example.schoolmate.woo.dto.teacherdto;

import com.example.schoolmate.common.entity.info.constant.TeacherStatus;

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
