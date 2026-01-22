package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.User;
import com.opencsv.bean.CsvBindByName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

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
        @Builder.Default
        private List<NotificationDTO.NotificationHistory> notifications = new ArrayList<>();

        public DetailResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();

            // 1. User 엔티티의 편의 메서드를 사용하여 TeacherInfo 추출
            TeacherInfo ti = user.getInfo(TeacherInfo.class);

            // 2. TeacherInfo가 존재할 경우에만 상세 정보 세팅
            if (ti != null) {
                this.subject = ti.getSubject();
                this.department = ti.getDepartment();
                this.position = ti.getPosition();

                // TeacherInfo 내부에 있는 status 정보 추출
                this.status = ti.getStatus();
                if (this.status != null) {
                    this.statusName = this.status.name();
                    this.statusDesc = this.status.getDescription(); // Enum에 있는 한글명 메서드
                }
            }
        }

        public void setNotifications(List<NotificationDTO.NotificationHistory> notifications) {
            this.notifications = notifications;
        }
    }

    // 정보 수정 요청용
    @Getter
    @Setter
    @ToString
    public static class UpdateRequest {
        private Long uid; // 수정할 대상의 식별자 (필수)
        private String name; // User 엔티티의 이름을 수정하기 위함
        private String subject;
        private String department;
        private String position;
        private String statusName;
    }

    // 정보 추가용
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String name;
        private String email;
        private String password;
        private String subject;
        private String department;
        private String position;

        public CreateRequest(CsvImportRequest csv) {
            this.name = csv.getName();
            this.email = csv.getEmail();
            this.password = csv.getPassword();
            this.subject = csv.getSubject();
            this.department = csv.getDepartment();
            this.position = csv.getPosition();
        }
    }

    @Getter
    @Setter
    public static class TeacherSearchCondition {
        private String type; // 검색 필드 (name, dept 등)
        private String keyword; // 검색어
        private boolean includeRetired;
    }

    @Getter
    @Setter
    public static class CsvImportRequest {
        @CsvBindByName(column = "이름")
        private String name;

        @CsvBindByName(column = "이메일")
        private String email;

        @CsvBindByName(column = "비밀번호")
        private String password;

        @CsvBindByName(column = "부서")
        private String department;

        @CsvBindByName(column = "직책")
        private String position;

        @CsvBindByName(column = "담당과목")
        private String subject;
    }
}