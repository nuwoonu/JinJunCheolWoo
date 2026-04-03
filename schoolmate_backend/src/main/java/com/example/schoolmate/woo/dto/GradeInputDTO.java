package com.example.schoolmate.woo.dto;

import com.example.schoolmate.common.entity.user.constant.TestType;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// [woo] 교사가 학생 성적 입력할 때 쓰는 DTO
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeInputDTO {

    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    @NotNull(message = "과목 ID는 필수입니다.")
    private Long subjectId;

    @NotNull(message = "시험 종류는 필수입니다.")
    private TestType testType;  // 중간고사, 기말고사 등

    @NotNull(message = "학기 ID는 필수입니다.")
    private Long academicTermId; // AcademicTerm PK

    @NotNull(message = "점수는 필수입니다.")
    @Min(value = 0, message = "점수는 0점 이상이어야 합니다.")
    @Max(value = 100, message = "점수는 100점 이하여야 합니다.")
    private Double score;
}
