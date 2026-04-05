package com.example.schoolmate.domain.grade.dto;

import com.example.schoolmate.domain.user.entity.constant.TestType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString
@Builder
public class GradeDTO {
    private Long id;
    private Long studentId;
    private String subjectName;
    private String subjectCode;
    private TestType examType;
    private Double score;

    // AcademicTerm 기반
    private Long academicTermId;
    private int schoolYear;
    private int semester;
    private String termDisplayName; // "2025학년도 1학기"
}
