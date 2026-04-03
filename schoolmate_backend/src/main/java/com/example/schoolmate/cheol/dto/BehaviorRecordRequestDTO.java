package com.example.schoolmate.cheol.dto;

import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

import lombok.Getter;
import lombok.NoArgsConstructor;

// [cheol] 행동 특성 및 종합의견 등록/수정 요청 DTO
@Getter
@NoArgsConstructor
public class BehaviorRecordRequestDTO {
    private Year year;
    private Semester semester;
    private String specialNotes;
}
