package com.example.schoolmate.cheol.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// [cheol] 행동 특성 및 종합의견 등록/수정 요청 DTO
@Getter
@NoArgsConstructor
public class BehaviorRecordRequestDTO {
    private int schoolYear;
    private int semester;
    private String specialNotes;
}
