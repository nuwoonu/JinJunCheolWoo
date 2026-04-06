package com.example.schoolmate.woo.dto;

import com.example.schoolmate.common.entity.user.constant.TestType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// [woo] 성적 응답 DTO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeResponseDTO {
    private Long gradeId;

    // 학생 정보
    private Long studentId;
    private String studentName;
    private Integer attendanceNum;

    // 과목 정보
    private Long subjectId;
    private String subjectName;

    // 시험 정보
    private TestType testType;
    private Double score;

    // 학기 정보
    private int schoolYear;
    private int semester;
}
