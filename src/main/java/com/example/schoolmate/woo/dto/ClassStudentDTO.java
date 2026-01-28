package com.example.schoolmate.woo.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 담당 반 학생 목록 조회용 DTO
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassStudentDTO {

    private Long classroomId;

    private int year; // 학년도

    private int grade; // 학년

    private int classNum; // 반

    private String className; // "2025학년도 3학년 2반"

    private int totalStudents;

    // 담임 교사 정보
    private String homeroomTeacherName;

    // 학생 목록
    private List<StudentSimpleDTO> students;

    // 학생 간단 정보 (내부 클래스)
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentSimpleDTO {
        private Long studentId;
        private String name;
        private Integer studentNumber; // 번호
        private String phone;
        private String email;
    }
}
