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
public class GradeDTO {
    private Long id;
    private String subjectName;
    private String subjectCode;
    private TestType examType;
    private Double score;
    private Double maxScore;
    private Integer semester;
    private Integer year;
}
