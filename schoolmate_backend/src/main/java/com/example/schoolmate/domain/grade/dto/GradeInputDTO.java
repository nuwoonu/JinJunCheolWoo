package com.example.schoolmate.domain.grade.dto;

import com.example.schoolmate.domain.user.entity.constant.TestType;

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
    private String subjectCode;   // 과목 코드 (TeacherService 교과교사 채점용)
    private Long academicTermId;  // 학기 ID (TeacherService 성적 저장용)
}
