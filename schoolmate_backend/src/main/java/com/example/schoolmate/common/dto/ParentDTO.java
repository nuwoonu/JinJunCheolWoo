package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
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
        private String status; // 기본값: 전체 (null이면 필터 없음) [woo]
        private boolean ignoreSchoolFilter; // true이면 학교 필터 미적용 (타 학교 학부모 검색 허용)
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
        private List<StudentRelationRequest> students = new ArrayList<>();

        public CreateRequest(CsvImportRequest csv) {
            this.name = csv.getName();
            this.email = csv.getEmail();
            this.password = csv.getPassword();
            this.phone = csv.getPhone();
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
     * [woo] 교사용 학부모 간편 등록 요청
     * 교사가 본인 반 학생의 학부모를 이름 + 전화번호 + 관계만으로 등록
     * 계정 자동 생성 (이메일: 전화번호, 비밀번호: 전화번호 뒷 4자리)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuickRegisterRequest {
        private Long studentInfoId;      // [woo] 학생 StudentInfo ID
        private String parentName;       // [woo] 학부모 이름
        private String phoneNumber;      // [woo] 전화번호 (계정 아이디로도 사용)
        private String relationship;     // [woo] FATHER, MOTHER, GRANDFATHER, GRANDMOTHER, OTHER
    }

    /**
     * [woo] 학부모 간편 등록 결과 응답
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuickRegisterResponse {
        private Long parentInfoId;
        private String parentName;
        private String loginEmail;       // [woo] 로그인용 이메일 (전화번호)
        private String childName;        // [woo] 연결된 자녀 이름
        private String relationship;     // [woo] 관계
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
        private String email;
        private boolean linked;
        private List<String> childrenStrings;
        private Long roleRequestId;
        private String roleRequestStatus;

        public Summary(ParentInfo entity) {
            this.id = entity.getId();
            this.name = entity.getParentName();
            this.code = entity.getCode();
            this.phone = entity.getPhone();
            this.linked = entity.getUser() != null;
            this.email = entity.getUser() != null ? entity.getUser().getEmail() : "-";
            this.childrenStrings = entity.getChildrenRelations().stream()
                    .map(r -> r.getStudentInfo().getUser().getName() + " (" + r.getRelationship().getDescription()
                            + ")")
                    .collect(Collectors.toList());
        }

        public void setRoleRequestId(Long roleRequestId) {
            this.roleRequestId = roleRequestId;
        }

        public void setRoleRequestStatus(String roleRequestStatus) {
            this.roleRequestStatus = roleRequestStatus;
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
        private List<LinkedStudent> children;
        private List<NotificationDTO.NotificationHistory> notifications = new ArrayList<>();
        private Long roleRequestId;
        private String roleRequestStatus;

        public DetailResponse(ParentInfo entity) {
            this.id = entity.getId();
            this.name = entity.getParentName();
            this.code = entity.getCode();
            this.phone = entity.getPhone();
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
        private String schoolName;

        public LinkedStudent(StudentInfo info, FamilyRelationship relation) {
            this.uid = info.getUser().getUid();
            this.name = info.getUser().getName();
            this.code = info.getCode();
            this.relationship = relation.getDescription();
            this.relationshipCode = relation.name();
            this.schoolName = info.getSchool() != null ? info.getSchool().getName() : null;
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
    }
}