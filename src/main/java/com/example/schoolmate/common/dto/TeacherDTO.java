package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.constant.TeacherStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class TeacherDTO {

    // 목록 및 상세 조회용
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailResponse {
        private Long uid;
        private String name;
        private String email;
        private String subject;

        private TeacherStatus status; // Enum 객체 자체 (상태 비교용)
        private String statusName; // "EMPLOYED", "LEAVE" 등
        private String statusDesc; // "재직", "휴직" 등 (화면 표시용)

        private String department;
        private String position;
    }

    // 정보 수정 요청용
    @Getter
    @Setter
    public static class UpdateRequest {
        private String subject;
        private TeacherStatus status; // Enum으로 직접 받기 (Spring이 자동 매핑)
        private String department;
        private String position;
    }

    // 정보 추가용
    @Getter
    @Setter
    public static class CreateRequest {
        private String name;
        private String email;
        private String password;
        private String subject;
        private String department;
        private String position;
    }
}