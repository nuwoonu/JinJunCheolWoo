package com.example.schoolmate.common.dto;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.info.constant.ClassroomStatus;
import com.example.schoolmate.common.entity.info.TeacherInfo;

import lombok.AllArgsConstructor;
import com.example.schoolmate.common.entity.log.ClassroomHistory;
import com.opencsv.bean.CsvBindByName;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 학급 데이터 전송 객체 (DTO)
 * 
 * 학급 관리 기능에서 사용되는 요청/응답 객체들을 포함합니다.
 */
public class ClassDTO {

    /**
     * 학급 검색 조건
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchCondition {
        private Integer year;
        private Integer grade;
        private String status = ClassroomStatus.ACTIVE.name(); // 기본값: 운영 중
    }

    /**
     * 학급 생성 요청
     */
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

    /**
     * 학급 정보 수정 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private Long cid;
        private Integer grade;
        private Integer classNum;
        private String status;
        private Long teacherUid;
    }

    /**
     * 학급 상세 정보 및 목록 조회용 응답
     * - 담임 교사, 학생 수, 학생 명단, 변경 이력 등을 포함합니다.
     */
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

        @Builder.Default
        private List<HistoryResponse> histories = new ArrayList<>();

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

    /**
     * 학급 상세 내 학생 명단 정보
     */
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

    /**
     * 학생 배정 요청
     */
    @Getter
    @Setter
    public static class StudentAssignmentRequest {
        private List<Long> studentUids;
    }

    /**
     * 담임 교사 선택 드롭다운용 응답
     */
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

    /**
     * CSV 파일 일괄 생성 요청
     */
    @Getter
    @Setter
    public static class CsvImportRequest {
        @CsvBindByName(column = "학년도")
        private Integer year;
        @CsvBindByName(column = "학년")
        private Integer grade;
        @CsvBindByName(column = "반")
        private Integer classNum;
        @CsvBindByName(column = "담임교사사번")
        private String teacherCode;
        @CsvBindByName(column = "학생학번목록")
        private String studentCodes; // 쉼표로 구분
    }

    /**
     * 학급 변경 이력 응답
     */
    @Getter
    @Builder
    public static class HistoryResponse {
        private String actionType;
        private String description;
        private String createdBy;
        private LocalDateTime createdAt;

        public static HistoryResponse from(ClassroomHistory history) {
            return HistoryResponse.builder()
                    .actionType(history.getActionType())
                    .description(history.getDescription())
                    .createdBy(history.getCreatedBy())
                    .createdAt(history.getCreatedAt())
                    .build();
        }
    }
}