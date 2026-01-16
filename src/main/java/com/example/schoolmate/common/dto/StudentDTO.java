package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.User;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public class StudentDTO {

    // 1. 목록 조회 조건
    @Getter
    @Setter
    @NoArgsConstructor
    public static class StudentSearchCondition {
        private String type; // name, email, studentIdentityNum
        private String keyword;
        private boolean includeInactive = false;
    }

    // 2. 신규 등록 요청 (계정 생성용)
    @Getter
    @Setter
    @NoArgsConstructor
    public static class CreateRequest {
        private String name;
        private String email;
        private String password;
        private String studentIdentityNum;

        // 초기 배정 정보 (선택 사항)
        private Integer year = LocalDate.now().getYear();
        private Integer grade;
        private Integer classNum;
        private Integer studentNum;
    }

    // 3. 인적 사항 및 학적 상태 수정 요청
    @Getter
    @Setter
    @NoArgsConstructor
    public static class UpdateRequest {
        private Long uid;
        private String name;
        private String studentIdentityNum;
        private String statusName; // StudentStatus Enum Name (ENROLLED, GRADUATED 등)
    }

    // 4. 학년도별 학급 배정 수정/추가 요청
    @Getter
    @Setter
    @NoArgsConstructor
    public static class AssignmentRequest {
        private Long uid;
        private int schoolYear;
        private Integer grade;
        private Integer classNum;
        private Integer studentNum;
    }

    // 5. 목록용 요약 응답 (Main Page용)
    @Getter
    public static class SummaryResponse {
        private Long uid;
        private String name;
        private String email;
        private String studentIdentityNum;
        private String status;
        private String latestClass;

        public SummaryResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();

            StudentInfo info = user.getInfo(StudentInfo.class);
            if (info != null) {
                this.studentIdentityNum = info.getStudentIdentityNum();
                this.status = info.getStatus().getDescription();

                // 최신 배정 정보 추출 (List가 비어있지 않은지 확인)
                if (info.getAssignments() != null && !info.getAssignments().isEmpty()) {
                    // schoolYear 기준 내림차순 정렬하여 최신 연도 정보를 가져옴
                    StudentAssignment latest = info.getAssignments().stream()
                            .sorted((a, b) -> b.getSchoolYear() - a.getSchoolYear())
                            .findFirst()
                            .orElse(null);

                    if (latest != null) {
                        this.latestClass = String.format("%d년 %s-%s-%s",
                                latest.getSchoolYear(),
                                latest.getGrade() != null ? latest.getGrade() : "?",
                                latest.getClassNum() != null ? latest.getClassNum() : "?",
                                latest.getStudentNum() != null ? latest.getStudentNum() : "?");
                    }
                } else {
                    this.latestClass = "미배정";
                }
            }
        }
    }

    // 6. 상세 페이지용 전체 데이터 응답 (Detail Page용)
    @Getter
    public static class DetailResponse {
        private Long uid;
        private String name;
        private String email;
        private String studentIdentityNum;
        private String statusName;
        private String statusDescription;

        private List<AssignmentInfo> assignments;
        private List<ParentInfoSummary> parents;

        public DetailResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();

            StudentInfo info = user.getInfo(StudentInfo.class);
            if (info != null) {
                this.studentIdentityNum = info.getStudentIdentityNum();
                this.statusName = info.getStatus().name();
                this.statusDescription = info.getStatus().getDescription();

                // 이력 데이터 변환 (최신 연도순)
                this.assignments = info.getAssignments().stream()
                        .map(AssignmentInfo::new)
                        .sorted((a, b) -> b.getSchoolYear() - a.getSchoolYear())
                        .collect(Collectors.toList());

                // 보호자 데이터 변환
                this.parents = info.getFamilyRelations().stream()
                        .map(ParentInfoSummary::new)
                        .collect(Collectors.toList());
            }
        }
    }

    @Getter
    public static class AssignmentInfo {
        private int schoolYear;
        private Integer grade;
        private Integer classNum;
        private Integer studentNum;

        public AssignmentInfo(StudentAssignment entity) {
            this.schoolYear = entity.getSchoolYear();
            this.grade = entity.getGrade();
            this.classNum = entity.getClassNum();
            this.studentNum = entity.getStudentNum();
        }
    }

    @Getter
    public static class ParentInfoSummary {
        private Long parentInfoId;
        private String name;
        private String phone;
        private String relationship;
        private boolean isRepresentative;

        public ParentInfoSummary(FamilyRelation rel) {
            this.parentInfoId = rel.getParentInfo().getId();
            this.name = rel.getParentInfo().getParentName();
            this.phone = rel.getParentInfo().getPhoneNumber();
            this.relationship = rel.getRelationship().getDescription();
            this.isRepresentative = rel.isRepresentative();
        }
    }
}