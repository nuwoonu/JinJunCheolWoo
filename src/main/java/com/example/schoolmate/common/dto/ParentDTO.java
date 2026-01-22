package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
import com.example.schoolmate.common.entity.notification.Notification;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.stream.Collectors;
import java.util.List;
import java.util.ArrayList;
import java.time.format.DateTimeFormatter;

public class ParentDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentSearchCondition {
        private String type; // name, email, phone, childName
        private String keyword;
    }

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
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentRelationRequest {
        private Long studentId;
        private String relationship;
    }

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

    @Getter
    public static class Summary {
        private Long id;
        private String name;
        private String phone;
        private String status;
        private String email;
        private boolean linked;
        private List<String> childrenStrings;

        public Summary(ParentInfo entity) {
            this.id = entity.getId();
            this.name = entity.getParentName();
            this.phone = entity.getPhoneNumber();
            this.status = entity.getStatus().getDescription();
            this.linked = entity.getUser() != null;
            this.email = entity.getUser() != null ? entity.getUser().getEmail() : "-";
            this.childrenStrings = entity.getChildrenRelations().stream()
                    .map(r -> r.getStudentInfo().getUser().getName() + " (" + r.getRelationship().getDescription()
                            + ")")
                    .collect(Collectors.toList());
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private Long id;
        private String name;
        private String phone;
        private String email;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class DetailResponse {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String status;
        private String statusName;
        private List<LinkedStudent> children;
        private List<NotificationHistory> notifications = new ArrayList<>();

        public DetailResponse(ParentInfo entity) {
            this.id = entity.getId();
            this.name = entity.getParentName();
            this.phone = entity.getPhoneNumber();
            this.status = entity.getStatus().getDescription();
            this.statusName = entity.getStatus().name();
            this.email = entity.getUser() != null ? entity.getUser().getEmail() : "-";
            this.children = entity.getChildrenRelations().stream()
                    .map(r -> new LinkedStudent(r.getStudentInfo(), r.getRelationship()))
                    .collect(Collectors.toList());
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LinkedStudent {
        private Long uid;
        private String name;
        private String identityNum;
        private String relationship;
        private String relationshipCode;

        public LinkedStudent(StudentInfo info, FamilyRelationship relation) {
            this.uid = info.getUser().getUid();
            this.name = info.getUser().getName();
            this.identityNum = info.getStudentIdentityNum();
            this.relationship = relation.getDescription();
            this.relationshipCode = relation.name();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class NotificationHistory {
        private String title;
        private String content;
        private String senderName;
        private String sentDate;

        public NotificationHistory(Notification n) {
            this.title = n.getTitle();
            this.content = n.getContent();
            this.senderName = n.getSender() != null ? n.getSender().getName() : "시스템";
            this.sentDate = n.getCreateDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        }
    }
}