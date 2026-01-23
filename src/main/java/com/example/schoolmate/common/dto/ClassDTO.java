package com.example.schoolmate.common.dto;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.info.constant.ClassroomStatus;
import com.example.schoolmate.common.entity.info.TeacherInfo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class ClassDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchCondition {
        private Integer year;
        private Integer grade;
        private String status = ClassroomStatus.ACTIVE.name(); // 기본값: 운영 중
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private Integer year;
        private Integer grade;
        private Integer classNum;
        private Long teacherUid; // 담임 교사 UID

        // 학생 배정 관련
        private List<Long> studentUids; // 수동 선택한 학생들
        private Integer randomCount; // 랜덤 배정할 인원 수
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private Long cid;
        private Long teacherUid;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailResponse {
        private Long cid;
        private Integer year;
        private Integer grade;
        private Integer classNum;

        private Long teacherUid;
        private String teacherName;
        private String teacherSubject;

        private String status;
        private String statusDescription;

        private int studentCount;

        @Builder.Default
        private List<StudentSummary> students = new ArrayList<>();

        public static DetailResponse from(Classroom classroom, int studentCount) {
            User teacher = classroom.getTeacher();
            String subject = "-";
            if (teacher != null && teacher.getInfo(TeacherInfo.class) != null) {
                subject = teacher.getInfo(TeacherInfo.class).getSubject();
            }

            return DetailResponse.builder()
                    .cid(classroom.getCid())
                    .year(classroom.getYear())
                    .grade(classroom.getGrade())
                    .classNum(classroom.getClassNum())
                    .teacherUid(teacher != null ? teacher.getUid() : null)
                    .teacherName(teacher != null ? teacher.getName() : "미배정")
                    .teacherSubject(subject)
                    .status(classroom.getStatus().name())
                    .statusDescription(classroom.getStatus().getDescription())
                    .studentCount(studentCount)
                    .build();
        }

        public String getGradeAndClass() {
            return grade + "학년 " + classNum + "반";
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentSummary {
        private Long uid;
        private String name;
        private String code;
        private Integer studentNum; // 번호
        private String gender; // 성별 (주민번호 뒷자리 등으로 추론하거나 데이터가 있다면)
        private String status;
    }

    @Getter
    @Setter
    public static class StudentAssignmentRequest {
        private List<Long> studentUids;
    }

    @Getter
    @Builder
    public static class TeacherSelectResponse {
        private Long uid;
        private String displayName;

        public static TeacherSelectResponse from(User user) {
            String subject = "-";
            if (user.getInfo(TeacherInfo.class) != null) {
                subject = user.getInfo(TeacherInfo.class).getSubject();
            }
            return TeacherSelectResponse.builder()
                    .uid(user.getUid())
                    .displayName(user.getName() + " (" + subject + ")")
                    .build();
        }
    }
}