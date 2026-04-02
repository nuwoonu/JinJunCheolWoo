package com.example.schoolmate.woo.dto;

import com.example.schoolmate.common.entity.user.constant.Semester;
import lombok.*;

import java.time.LocalDateTime;

// [woo] 성적 비율 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeRatioResponseDTO {

    private Long id;
    private Long classroomId;
    private String classroomName;
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    private Semester semester;
    private int schoolYear;
    private int midtermRatio;
    private int finalRatio;
    private int homeworkRatio;
    private int quizRatio;
    private String setTeacherName;
    private LocalDateTime updatedAt;
}
