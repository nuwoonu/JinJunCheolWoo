package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;
import com.opencsv.bean.CsvBindByName;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.stream.Collectors;
import java.util.List;
import java.util.ArrayList;

/**
 * 학부모 데이터 전송 객체 (DTO)
 * 
 * 학부모 관리 기능에서 사용되는 요청/응답 객체들을 포함합니다.
 */
public class ParentDTO {

    /**
     * 학부모 검색 조건
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentSearchCondition {
        private String type; // name, email, phone, childName
        private String keyword;
        private String status = ParentStatus.ACTIVE.name(); // 기본값: 연결됨
    }

    /**
     * 학부모 신규 등록 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String name;
        private String email;
        private String password;
        private String phone;
        private String code;
        private List<StudentRelationRequest> students = new ArrayList<>();

        public CreateRequest(CsvImportRequest csv) {
            this.name = csv.getName();
            this.email = csv.getEmail();
            this.password = csv.getPassword();
            this.phone = csv.getPhone();
            this.code = csv.getCode();
        }
    }

    /**
     * 학부모 등록 시 자녀 연동 정보
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentRelationRequest {
        private Long studentId;
        private String relationship;
    }

    /**
     * 학부모 간편 등록 요청 (현재 미사용 가능성 있음)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class QuickRegisterRequest {
        private Long studentUid;
        private String parentName;
        private String phoneNumber;
        private String relationship; // FATHER, MOTHER 등
        private boolean representative;
    }

    /**
     * 학부모 목록 조회용 요약 정보 응답
     */
    @Getter
    public static class Summary {
        private Long id;
        private String name;
        private String code;
        private String phone;
        private String status;
        private String statusName;
        private String email;
        private boolean linked;
        private List<String> childrenStrings;

        public Summary(ParentInfo entity) {
            this.id = entity.getId();
            this.name = entity.getParentName();
            this.code = entity.getCode();
            this.phone = entity.getPhoneNumber();
            this.status = entity.getStatus().getDescription();
            this.statusName = entity.getStatus().name();
            this.linked = entity.getUser() != null;
            this.email = entity.getUser() != null ? entity.getUser().getEmail() : "-";
            this.childrenStrings = entity.getChildrenRelations().stream()
                    .map(r -> r.getStudentInfo().getUser().getName() + " (" + r.getRelationship().getDescription()
                            + ")")
                    .collect(Collectors.toList());
        }
    }

    /**
     * 학부모 정보 수정 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private Long id;
        private String name;
        private String code;
        private String phone;
        private String email;
        private String statusName;
    }

    /**
     * 학부모 상세 정보 응답
     * - 자녀 목록 및 알림 이력을 포함합니다.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class DetailResponse {
        private Long id;
        private String name;
        private String code;
        private String email;
        private String phone;
        private String status;
        private String statusName;
        private List<LinkedStudent> children;
        private List<NotificationDTO.NotificationHistory> notifications = new ArrayList<>();

        public DetailResponse(ParentInfo entity) {
            this.id = entity.getId();
            this.name = entity.getParentName();
            this.code = entity.getCode();
            this.phone = entity.getPhoneNumber();
            this.status = entity.getStatus().getDescription();
            this.statusName = entity.getStatus().name();
            this.email = entity.getUser() != null ? entity.getUser().getEmail() : "-";
            this.children = entity.getChildrenRelations().stream()
                    .map(r -> new LinkedStudent(r.getStudentInfo(), r.getRelationship()))
                    .collect(Collectors.toList());
        }
    }

    /**
     * 학부모 상세 정보 내 자녀 정보
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LinkedStudent {
        private Long uid;
        private String name;
        private String code;
        private String relationship;
        private String relationshipCode;

        public LinkedStudent(StudentInfo info, FamilyRelationship relation) {
            this.uid = info.getUser().getUid();
            this.name = info.getUser().getName();
            this.code = info.getCode();
            this.relationship = relation.getDescription();
            this.relationshipCode = relation.name();
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

        @CsvBindByName(column = "연락처")
        private String phone;

        @CsvBindByName(column = "학부모코드")
        private String code;
    }
}