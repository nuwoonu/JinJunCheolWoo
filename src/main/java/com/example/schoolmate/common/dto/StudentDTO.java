package com.example.schoolmate.common.dto;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.User;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class StudentDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentSearchCondition {
        private String type;
        private String keyword;
        private boolean includeInactive;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String name;
        private String email;
        private String password;
        private String studentIdentityNum;

        // 초기 배정 정보
        private Integer year;
        private Integer grade;
        private Integer classNum;
        private Integer studentNum;

        // 보호자 연동 정보
        private List<ParentRelationRequest> guardians = new ArrayList<>();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentRelationRequest {
        private Long parentId;
        private String relationship;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private Long uid;
        private String name;
        private String studentIdentityNum;
        private String statusName;
        private String basicHabits;
        private String specialNotes;
    }

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

    @Getter
    public static class SummaryResponse {
        private Long uid;
        private String name;
        private String email;
        private String studentIdentityNum;
        private String latestClass;
        private String status;

        public SummaryResponse(User user) {
            this.uid = user.getUid();
            this.name = user.getName();
            this.email = user.getEmail();
            StudentInfo info = user.getInfo(StudentInfo.class);
            if (info != null) {
                this.studentIdentityNum = info.getStudentIdentityNum();
                this.status = info.getStatus() != null ? info.getStatus().getDescription() : "-";
                this.latestClass = info.getLatestAssignment()
                        .map(a -> a.getSchoolYear() + "년 " + a.getGrade() + "-" + a.getClassNum() + "-"
                                + a.getStudentNum())
                        .orElse("-");
            }
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class DetailResponse {
        private Long uid;
        private String name;
        private String email;
        private String studentIdentityNum;
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
                this.studentIdentityNum = info.getStudentIdentityNum();
                this.statusName = info.getStatus() != null ? info.getStatus().name() : "";
                this.statusDescription = info.getStatus() != null ? info.getStatus().getDescription() : "";
                this.basicHabits = info.getBasicHabits();
                this.specialNotes = info.getSpecialNotes();
                this.assignments = info.getAssignments();
            }
        }
    }

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
}