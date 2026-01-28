package com.example.schoolmate.common.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.example.schoolmate.common.entity.info.StaffInfo;
import com.example.schoolmate.common.entity.info.constant.EmploymentType;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.entity.user.User;
import com.opencsv.bean.CsvBindByName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 교직원 데이터 전송 객체 (DTO)
 * 
 * 교직원 관리 기능에서 사용되는 요청/응답 객체들을 포함합니다.
 */
public class StaffDTO {

    /**
     * 교직원 검색 조건
     */
    @Getter
    @Setter
    public static class StaffSearchCondition {
        private String type;
        private String keyword;
        private String status = StaffStatus.EMPLOYED.name(); // 기본값: 재직
        private String employmentType;
    }

    /**
     * 교직원 신규 등록 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String name;
        private String email;
        private String password;
        private String code;
        private String department;
        private String jobTitle;
        private String workLocation;
        private String extensionNumber;
        private String employmentType;
        private LocalDate contractEndDate;

        public CreateRequest(CsvImportRequest csv) {
            this.name = csv.getName();
            this.email = csv.getEmail();
            this.password = csv.getPassword();
            this.code = csv.getCode();
            this.department = csv.getDepartment();
            this.jobTitle = csv.getJobTitle();
            this.workLocation = csv.getWorkLocation();
            this.extensionNumber = csv.getExtensionNumber();
            // CSV에서는 기본값 처리 또는 별도 파싱 로직 필요 (여기서는 생략)
        }
    }

    /**
     * 교직원 정보 수정 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private Long uid;
        private String name;
        private String code;
        private String department;
        private String jobTitle;
        private String workLocation;
        private String extensionNumber;
        private String statusName;
        private String employmentType;
        private LocalDate contractEndDate;
    }

    /**
     * 교직원 상세 정보 및 목록 조회용 응답
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

        private StaffStatus status;
        private String statusName;
        private String statusDesc;

        private String department;
        private String jobTitle;
        private String workLocation;
        private String extensionNumber;

        private EmploymentType employmentType;
        private String employmentTypeDesc;
        private LocalDate contractEndDate;

        @Builder.Default
        private List<NotificationDTO.NotificationHistory> notifications = new ArrayList<>();
        private Set<UserRole> roles;

        public DetailResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();
            this.roles = user.getRoles();

            StaffInfo info = user.getInfo(StaffInfo.class);
            if (info != null) {
                this.code = info.getCode();
                this.department = info.getDepartment();
                this.jobTitle = info.getJobTitle();
                this.workLocation = info.getWorkLocation();
                this.extensionNumber = info.getExtensionNumber();
                this.employmentType = info.getEmploymentType();
                this.employmentTypeDesc = info.getEmploymentType() != null ? info.getEmploymentType().getDescription()
                        : "-";
                this.contractEndDate = info.getContractEndDate();

                this.status = info.getStatus();
                if (this.status != null) {
                    this.statusName = this.status.name();
                    this.statusDesc = this.status.getDescription();
                }
            }
        }

        public void setNotifications(List<NotificationDTO.NotificationHistory> notifications) {
            this.notifications = notifications;
        }
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
        @CsvBindByName(column = "사번")
        private String code;
        @CsvBindByName(column = "부서")
        private String department;
        @CsvBindByName(column = "직함")
        private String jobTitle;
        @CsvBindByName(column = "근무지")
        private String workLocation;
        @CsvBindByName(column = "내선번호")
        private String extensionNumber;
    }
}
