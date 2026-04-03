package com.example.schoolmate.woo.dto;

import com.example.schoolmate.common.entity.user.constant.TestType;
import lombok.*;

// [woo] 교사 채점 목록용 성적 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeResponseDTO {

    private Long id;
    private Long studentId;
    private String studentName;
    private Integer attendanceNum;
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private TestType testType;
    private Double score;
    private int semester;
    private int schoolYear;
    private String inputTeacherName;
}
