package com.example.schoolmate.common.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.example.schoolmate.cheol.entity.BehaviorRecord;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;
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
        private String roleRequestStatus; // [soojin] 대시보드 대기 목록 필터링용 (null이면 필터 없음)
        private boolean ignoreSchoolFilter; // true이면 학교 필터 미적용 (타 학교 학생 검색 허용)
        private Long excludeParentId; // 지정된 학부모와 이미 연결된 학생 제외
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
        private Long classroomId; // 학급 선택용 ID
        private Integer grade;
        private Integer classNum;
        private Integer attendanceNum;

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
            this.attendanceNum = csv.getAttendanceNum();
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
        private Long classroomId;
        private int grade;
        private int classNum;
        private int attendanceNum;
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
        private String statusName;
        private Long roleRequestId;
        private String roleRequestStatus;
        private LocalDateTime roleRequestCreateDate; // [soojin] 대시보드 대기 목록 최신순 정렬용
        private String schoolName;

        public SummaryResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();
            StudentInfo info = user.getInfo(StudentInfo.class);
            if (info != null) {
                this.code = info.getCode();
                this.statusName = info.getStatus() != null ? info.getStatus().name() : null;
                this.schoolName = info.getSchool() != null ? info.getSchool().getName() : null;
                if (info.getCurrentAssignment() != null && info.getCurrentAssignment().getClassroom() != null) {
                    StudentAssignment a = info.getCurrentAssignment();
                    this.latestClass = a.getSchoolYear() + "년 " + a.getGrade() + "학년 " + a.getClassNum() + "반";
                } else {
                    this.latestClass = "-";
                }
            }
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
        private List<BehaviorRecordInfo> behaviorRecords = new ArrayList<>();
        private List<AssignmentInfo> assignments;
        private List<LinkedGuardian> guardians = new ArrayList<>();
        private Long roleRequestId;
        private String roleRequestStatus;

        public DetailResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();
            StudentInfo info = user.getInfo(StudentInfo.class);
            if (info != null) {
                this.code = info.getCode();
                this.statusName = info.getStatus() != null ? info.getStatus().name() : "";
                this.statusDescription = info.getStatus() != null ? info.getStatus().getDescription() : "";
                this.behaviorRecords = info.getBehaviorRecords().stream()
                        .map(BehaviorRecordInfo::new)
                        .collect(Collectors.toList());
                this.assignments = info.getAssignments().stream()
                        .map(AssignmentInfo::new).toList();
            }
        }
    }

    @Getter
    @NoArgsConstructor
    public static class BehaviorRecordInfo {
        private Long id;
        private Year year;
        private Semester semester;
        private String specialNotes;

        public BehaviorRecordInfo(BehaviorRecord b) {
            this.id = b.getId();
            this.year = b.getYear();
            this.semester = b.getSemester();
            this.specialNotes = b.getSpecialNotes();
        }
    }

    @Getter
    @NoArgsConstructor
    public static class AssignmentInfo {
        private Long id;
        private int schoolYear;
        private Integer grade;
        private Integer classNum;
        private Integer attendanceNum;

        public AssignmentInfo(StudentAssignment a) {
            this.id = a.getId();
            this.schoolYear = a.getSchoolYear();
            this.grade = a.getGrade();
            this.classNum = a.getClassNum();
            this.attendanceNum = a.getAttendanceNum();
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
            this.phone = relation.getParentInfo().getPhone();
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
        private Integer attendanceNum;
    }
}