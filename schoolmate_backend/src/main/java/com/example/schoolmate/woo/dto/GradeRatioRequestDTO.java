package com.example.schoolmate.woo.dto;

import com.example.schoolmate.common.entity.user.constant.Semester;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

// [woo] 성적 비율 설정 요청 DTO
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeRatioRequestDTO {

    @NotNull
    private Long classroomId;

    @NotNull
    private Long subjectId;

    @NotNull
    private Semester semester;

    @NotNull
    private Integer schoolYear;

    @Min(0) @Max(100)
    private int midtermRatio;

    @Min(0) @Max(100)
    private int finalRatio;

    @Min(0) @Max(100)
    private int homeworkRatio;

    @Min(0) @Max(100)
    private int quizRatio;
}
