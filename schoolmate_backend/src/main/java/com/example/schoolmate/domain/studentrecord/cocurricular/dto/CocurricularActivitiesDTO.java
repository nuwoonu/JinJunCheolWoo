package com.example.schoolmate.domain.studentrecord.cocurricular.dto;

import com.example.schoolmate.domain.user.entity.constant.ActivityCategory;

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
    private Long academicTermId;
    private String termDisplayName;
    private ActivityCategory category;
    private String specifics;
}
