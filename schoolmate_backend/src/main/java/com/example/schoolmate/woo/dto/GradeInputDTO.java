package com.example.schoolmate.woo.dto;

import com.example.schoolmate.common.entity.user.constant.TestType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// [woo] 성적 입력 DTO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GradeInputDTO {
    private Long courseSectionId; // CourseSection PK (교사+과목+학급+학기)
    private Long studentId;       // StudentInfo PK
    private TestType testType;    // MIDTERMTEST | FINALTEST | QUIZ | HOMEWORK
    private Double score;         // 0 ~ 100
}
