package com.example.schoolmate.cheol.dto;

import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.TestType;
import com.example.schoolmate.common.entity.user.constant.Year;

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
    private Semester semester;
    private Year year;

}
