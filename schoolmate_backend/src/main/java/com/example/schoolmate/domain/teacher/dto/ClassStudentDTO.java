package com.example.schoolmate.domain.teacher.dto;

import java.time.LocalDate;
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

    // [woo] 학교별 NEIS 시간표 조회용
    private Long schoolId;

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
        // [soojin] 학생 관리 페이지 테이블 컬럼 추가
        private String gender;
        private LocalDate birthDate;
        private String parentName;
    }
}
