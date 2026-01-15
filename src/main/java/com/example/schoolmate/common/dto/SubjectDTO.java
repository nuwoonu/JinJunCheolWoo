package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.constant.TestType;

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
public class SubjectDTO {

    private String subjectCode;
    private String subjectName;
    private TestType examType;
    private Double score;
    private Integer semester;
    private Integer year;
}
