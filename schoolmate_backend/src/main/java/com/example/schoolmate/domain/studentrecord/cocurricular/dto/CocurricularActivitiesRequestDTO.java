package com.example.schoolmate.domain.studentrecord.cocurricular.dto;

import com.example.schoolmate.domain.user.entity.constant.ActivityCategory;

import lombok.Getter;
import lombok.NoArgsConstructor;

// [cheol] 창의적 체험활동 등록/수정 요청 DTO
@Getter
@NoArgsConstructor
public class CocurricularActivitiesRequestDTO {
    private Long academicTermId;
    private ActivityCategory category;
    private String specifics;
}
