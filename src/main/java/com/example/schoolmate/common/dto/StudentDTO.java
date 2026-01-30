package com.example.schoolmate.common.dto;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.User;
import com.opencsv.bean.CsvBindByName;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 학생 데이터 전송 객체 (DTO)
 * 
 * 학생 관리 기능에서 사용되는 요청/응답 객체들을 포함합니다.
 */
public class StudentDTO {

    /**
     * 학생 검색 조건
     * - type: 검색 필드 (이름, 이메일, 학번)
     * - keyword: 검색어
     * - status: 학적 상태 (재학, 휴학 등)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentSearchCondition {
        private String type;
        private String keyword;
        private String status; // 기본값: 전체 (null이면 필터 없음) [woo]
    }

    /**
     * 학생 신규 등록 요청
     * - 계정 정보(이름, 이메일, 비번)와 초기 학급 배정 정보를 포함합니다.
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

        // 초기 배정 정보
        private Integer year;
        private Integer grade;
        private Integer classNum;
        private Integer studentNum;

        // 보호자 연동 정보
        private List<ParentRelationRequest> guardians = new ArrayList<>();

        public CreateRequest(CsvImportRequest csv) {
            this.name = csv.getName();
            this.email = csv.getEmail();
            this.password = csv.getPassword();
            this.code = csv.getCode();
            this.year = csv.getYear();
            this.grade = csv.getGrade();
            this.classNum = csv.getClassNum();
            this.studentNum = csv.getStudentNum();
        }
    }

    /**
     * 학생 등록 시 보호자 연동 정보
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentRelationRequest {
        private Long parentId;
        private String relationship;
    }

    /**
     * 학생 기본 정보 수정 요청
     * - 이름, 학번, 상태, 특이사항 등을 수정합니다.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private Long uid;
        private String name;
        private String code;
        private String statusName;
        private String basicHabits;
        private String specialNotes;
    }

    /**
     * 학적(반 배정) 이력 추가/수정 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignmentRequest {
        private Long uid;
        private int schoolYear;
        private int grade;
        private int classNum;
        private int studentNum;
    }

    /**
     * 학생 목록 조회용 요약 정보 응답
     * - 목록 테이블에 표시될 핵심 정보만 담습니다.
     */
    @Getter
    public static class SummaryResponse {
        private Long uid;
        private String name;
        private String email;
        private String code;
        private String latestClass;
        private String status;

        public SummaryResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();
            StudentInfo info = user.getInfo(StudentInfo.class);
            if (info != null) {
                this.code = info.getCode();
                this.status = info.getStatus() != null ? info.getStatus().getDescription() : "-";
                this.latestClass = info.getLatestAssignment()
                        .map(a -> a.getSchoolYear() + "년 " + a.getGrade() + "-" + a.getClassNum() + "-"
                                + a.getStudentNum())
                        .orElse("-");
            }
        }
    }

    /**
     * 학생 상세 정보 응답
     * - 기본 정보, 학적 이력, 보호자 목록 등 모든 정보를 포함합니다.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class DetailResponse {
        private Long uid;
        private String name;
        private String email;
        private String code;
        private String statusName;
        private String statusDescription;
        private String basicHabits;
        private String specialNotes;
        private List<StudentAssignment> assignments;
        private List<LinkedGuardian> guardians = new ArrayList<>();

        public DetailResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();
            StudentInfo info = user.getInfo(StudentInfo.class);
            if (info != null) {
                this.code = info.getCode();
                this.statusName = info.getStatus() != null ? info.getStatus().name() : "";
                this.statusDescription = info.getStatus() != null ? info.getStatus().getDescription() : "";
                this.basicHabits = info.getBasicHabits();
                this.specialNotes = info.getSpecialNotes();
                this.assignments = info.getAssignments();
            }
        }
    }

    /**
     * 학생 상세 정보 내 보호자 정보
     */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class LinkedGuardian {
        private Long parentId;
        private String name;
        private String phone;
        private String relationship;
        private String relationshipCode;

        public LinkedGuardian(com.example.schoolmate.common.entity.info.FamilyRelation relation) {
            this.parentId = relation.getParentInfo().getId();
            this.name = relation.getParentInfo().getParentName();
            this.phone = relation.getParentInfo().getPhoneNumber();
            this.relationship = relation.getRelationship().getDescription();
            this.relationshipCode = relation.getRelationship().name();
        }
    }

    /**
     * CSV 파일 일괄 등록 요청
     * - OpenCSV 라이브러리와 매핑됩니다.
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

        @CsvBindByName(column = "학번")
        private String code;

        @CsvBindByName(column = "학년도")
        private Integer year;

        @CsvBindByName(column = "학년")
        private Integer grade;

        @CsvBindByName(column = "반")
        private Integer classNum;

        @CsvBindByName(column = "번호")
        private Integer studentNum;
    }
}