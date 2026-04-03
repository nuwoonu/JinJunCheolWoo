package com.example.schoolmate.cheol.dto;

import com.example.schoolmate.common.entity.user.constant.ActivityCategory;
import com.example.schoolmate.common.entity.user.constant.Year;

import lombok.Getter;
import lombok.NoArgsConstructor;

// [cheol] 창의적 체험활동 등록/수정 요청 DTO
@Getter
@NoArgsConstructor
public class CocurricularActivitiesRequestDTO {
    private Year year;
    private ActivityCategory category;
    private String specifics;
}
