package com.example.schoolmate.woo.dto;

import com.example.schoolmate.common.entity.user.constant.Semester;
import lombok.*;

import java.time.LocalDateTime;

// [woo] 최종 성적 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalGradeResponseDTO {

    private Long id;
    private Long studentId;
    private String studentName;
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Semester semester;
    private int schoolYear;
    private Double midtermScore;
    private Double finalExamScore;
    private Double homeworkScore;
    private Double quizScore;
    private Double totalScore;
    private Integer midtermRatio;
    private Integer finalRatio;
    private Integer homeworkRatio;
    private Integer quizRatio;
    private LocalDateTime calculatedAt;
}
