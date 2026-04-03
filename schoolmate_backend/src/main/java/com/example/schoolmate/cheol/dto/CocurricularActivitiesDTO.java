package com.example.schoolmate.cheol.dto;

import com.example.schoolmate.common.entity.user.constant.ActivityCategory;
import com.example.schoolmate.common.entity.user.constant.Year;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// [cheol] 창의적 체험활동 응답 DTO
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CocurricularActivitiesDTO {
    private Long id;
    private Long studentId;
    private Year year;
    private ActivityCategory category;
    private String specifics;
}
