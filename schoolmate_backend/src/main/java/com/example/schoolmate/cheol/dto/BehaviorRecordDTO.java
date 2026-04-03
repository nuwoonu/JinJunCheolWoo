package com.example.schoolmate.cheol.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// [cheol] 행동 특성 및 종합의견 DTO
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BehaviorRecordDTO {
    private Long id;
    private Long studentId;
    private int schoolYear;
    private int semester;
    private String specialNotes;
}
