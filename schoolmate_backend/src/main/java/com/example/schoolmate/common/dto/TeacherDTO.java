package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.entity.user.User;
import com.opencsv.bean.CsvBindByName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * 교사 데이터 전송 객체 (DTO)
 * 
 * 교사 관리 기능에서 사용되는 요청/응답 객체들을 포함합니다.
 */
public class TeacherDTO {

    /**
     * 교사 상세 정보 및 목록 조회용 응답
     * - User 정보와 TeacherInfo 정보를 합쳐서 제공합니다.
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailResponse {
        private Long uid;
        private String name;
        private String email;
        private String code;
        private String subject;     // 과목명 (프로필 표시용)
        private String subjectCode; // 과목 코드 (폼 선택값용) // cheol

        private String statusName;

        private String department;
        private String position;
        @Builder.Default
        private List<NotificationDTO.NotificationHistory> notifications = new ArrayList<>();
        private Set<UserRole> roles;
        private Long roleRequestId;
        private String roleRequestStatus;
        private LocalDateTime roleRequestCreateDate; // [soojin] 대시보드 대기 목록 최신순 정렬용

        public DetailResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();
            this.roles = user.getRoles();

            // 1. User 엔티티의 편의 메서드를 사용하여 TeacherInfo 추출
            TeacherInfo ti = user.getInfoForSchool(TeacherInfo.class,
                    com.example.schoolmate.config.school.SchoolContextHolder.getSchoolId());

            // 2. TeacherInfo가 존재할 경우에만 상세 정보 세팅
            if (ti != null) {
                this.code = ti.getCode();
                this.subject = ti.getSubject() != null ? ti.getSubject().getName() : null; // cheol
                this.subjectCode = ti.getSubject() != null ? ti.getSubject().getCode() : null; // cheol
                this.department = ti.getDepartment();
                this.position = ti.getPosition();

                if (ti.getStatus() != null) {
                    this.statusName = ti.getStatus().name();
                }
            }
        }

        public void setNotifications(List<NotificationDTO.NotificationHistory> notifications) {
            this.notifications = notifications;
        }

        public void setRoleRequestId(Long roleRequestId) {
            this.roleRequestId = roleRequestId;
        }

        public void setRoleRequestStatus(String roleRequestStatus) {
            this.roleRequestStatus = roleRequestStatus;
        }

        public void setRoleRequestCreateDate(LocalDateTime roleRequestCreateDate) { // [soojin] 대시보드 대기 목록 최신순 정렬용
            this.roleRequestCreateDate = roleRequestCreateDate;
        }
    }

    /**
     * 교사 정보 수정 요청
     */
    @Getter
    @Setter
    @ToString
    public static class UpdateRequest {
        private Long uid; // 수정할 대상의 식별자 (필수)
        private String name; // User 엔티티의 이름을 수정하기 위함
        private String code;
        private String subject;
        private String department;
        private String position;
        private String statusName;
    }

    /**
     * 교사 신규 등록 요청
     */
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
        private String grantedRole; // 등록 시 즉시 부여할 권한 (선택)

        public CreateRequest(CsvImportRequest csv) {
            this.name = csv.getName();
            this.email = csv.getEmail();
            this.password = csv.getPassword();
            this.subject = csv.getSubject();
            this.department = csv.getDepartment();
            this.position = csv.getPosition();
        }
    }

    /**
     * 교사 검색 조건
     */
    @Getter
    @Setter
    public static class TeacherSearchCondition {
        private String type; // 검색 필드 (name, dept 등)
        private String keyword; // 검색어
        private String status; // 기본값: 전체 (null이면 필터 없음) [woo]
        private String roleRequestStatus; // [soojin] 대시보드 대기 목록 필터링용 (null이면 필터 없음)
    }

    /**
     * CSV 파일 일괄 등록 요청
     */
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