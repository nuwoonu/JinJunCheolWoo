package com.example.schoolmate.domain.grade.dto;

import com.example.schoolmate.domain.user.entity.constant.TestType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// [woo] 성적 DTO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeDTO {
    private Long id;

    // 학생 정보
    private Long studentId;
    private String studentName;
    private Integer attendanceNum;

    // 과목 정보
    private Long subjectId;
    private String subjectName;
    private String subjectCode;

    // 시험 정보
    private TestType examType;
    private Double score;

    // 학기 정보
    private Long academicTermId;
    private int schoolYear;
    private int semester;
    private String termDisplayName;
}
