package com.example.schoolmate.domain.classgoal.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// [soojin] 학급 목표 DTO
public class ClassGoalDTO {

    // 저장/수정 요청 (교사)
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveRequest {
        private String goal;                  // 이달의 목표
        private List<String> actionItems;     // 실천 사항 목록
    }

    // 응답 (학생/교사 공통 조회)
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long classroomId;
        private int year;
        private int month;
        private String goal;
        private List<String> actionItems;
    }
}
