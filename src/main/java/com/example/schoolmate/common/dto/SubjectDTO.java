package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.constant.TestType;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class SubjectDTO {

    private String subjectCode;
    private String subjectName;
    private TestType examType;
    private Double score;
    private Integer semester;
    private Integer year;
}
