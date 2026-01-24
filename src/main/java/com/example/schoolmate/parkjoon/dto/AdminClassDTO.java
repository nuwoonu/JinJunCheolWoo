package com.example.schoolmate.parkjoon.dto;

import lombok.Builder;
import lombok.Getter;

public class AdminClassDTO {
    // 1. 메인 페이지의 학급 목록 한 줄 정보
    @Getter
    @Builder
    public static class ClassInfoResponse {
        private Long cid;
        private String gradeAndClass; // "1학년 3반" (가공된 데이터)
        private String teacherName;
        private String subject;
    }

    // 2. 메인 페이지 하단 교사 선택 드롭다운용 정보
    @Getter
    @Builder
    public static class TeacherSelectResponse {
        private Long uid;
        private String displayName; // "이교사 (수학)"
    }
}
