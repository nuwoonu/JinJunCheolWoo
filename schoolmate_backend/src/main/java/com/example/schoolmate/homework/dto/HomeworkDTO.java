package com.example.schoolmate.homework.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.schoolmate.common.service.FileManager;
import com.example.schoolmate.homework.entity.Homework;
import com.example.schoolmate.homework.entity.HomeworkStatus;
import com.example.schoolmate.homework.entity.HomeworkSubmission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * [woo] 과제 관련 DTO 통합 클래스
 */
public class HomeworkDTO {

    // ========== 과제 출제 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "제목은 필수입니다")
        private String title;

        @NotBlank(message = "내용은 필수입니다")
        private String content;

        @NotNull(message = "수업 분반은 필수입니다")
        private Long courseSectionId;

        @NotNull(message = "마감일은 필수입니다")
        private LocalDateTime dueDate;

        private Integer maxScore;
    }

    // ========== 과제 응답 (목록용) ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private Long id;
        private String title;
        private String teacherName;
        private String classroomName;
        private Long classroomId;
        private String subjectName;
        private String termName;
        private Long courseSectionId;
        private HomeworkStatus status;
        private LocalDateTime dueDate;
        private boolean hasAttachment;
        private Integer maxScore;
        private int submissionCount;
        private int totalStudentCount;
        private LocalDateTime createDate;

        // [woo] 학생용: 본인 제출 여부
        private Boolean submitted;

        // [woo] 학생용: 채점 점수·피드백 (목록에서 확인)
        private Integer score;
        private String feedback;
        private HomeworkSubmission.SubmissionStatus submissionStatus;

        public static ListResponse fromEntity(Homework homework, int totalStudentCount) {
            return ListResponse.builder()
                    .id(homework.getId())
                    .title(homework.getTitle())
                    .teacherName(homework.getCourseSection().getTeacher().getUser().getName())
                    .classroomName(homework.getCourseSection().getClassroom().getClassName())
                    .classroomId(homework.getCourseSection().getClassroom().getCid())
                    .courseSectionId(homework.getCourseSection().getId())
                    .subjectName(homework.getCourseSection().getSubject().getName())
                    .termName(homework.getCourseSection().getTerm().getDisplayName())
                    .status(homework.getStatus())
                    .dueDate(homework.getDueDate())
                    .hasAttachment(homework.getAttachmentUrl() != null)
                    .maxScore(homework.getMaxScore())
                    .submissionCount(homework.getSubmissions().size())
                    .totalStudentCount(totalStudentCount)
                    .createDate(homework.getCreateDate())
                    .build();
        }
    }

    // ========== 과제 상세 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailResponse {
        private Long id;
        private String title;
        private String content;
        private String teacherName;
        private Long teacherUserId;
        private String classroomName;
        private Long classroomId;
        private String subjectName;
        private String termName;
        private Long courseSectionId;
        private HomeworkStatus status;
        private LocalDateTime dueDate;
        private String attachmentUrl;
        private String attachmentOriginalName;
        private Integer maxScore;
        private int submissionCount;
        private int totalStudentCount;
        private LocalDateTime createDate;
        private LocalDateTime updateDate;

        // [woo] 제출 목록 (교사용)
        private List<SubmissionResponse> submissions;

        // [woo] 본인 제출 정보 (학생용)
        private SubmissionResponse mySubmission;

        public static DetailResponse fromEntity(Homework homework, int totalStudentCount) {
            return DetailResponse.builder()
                    .id(homework.getId())
                    .title(homework.getTitle())
                    .content(homework.getContent())
                    .teacherName(homework.getCourseSection().getTeacher().getUser().getName())
                    .teacherUserId(homework.getCourseSection().getTeacher().getUser().getUid())
                    .classroomName(homework.getCourseSection().getClassroom().getClassName())
                    .classroomId(homework.getCourseSection().getClassroom().getCid())
                    .courseSectionId(homework.getCourseSection().getId())
                    .subjectName(homework.getCourseSection().getSubject().getName())
                    .termName(homework.getCourseSection().getTerm().getDisplayName())
                    .status(homework.getStatus())
                    .dueDate(homework.getDueDate())
                    .attachmentUrl(homework.getAttachmentUrl() != null ? FileManager.UploadType.HOMEWORK.toUrl(homework.getAttachmentUrl()) : null)
                    .attachmentOriginalName(homework.getAttachmentOriginalName())
                    .maxScore(homework.getMaxScore())
                    .submissionCount(homework.getSubmissions().size())
                    .totalStudentCount(totalStudentCount)
                    .createDate(homework.getCreateDate())
                    .updateDate(homework.getUpdateDate())
                    .build();
        }
    }

    // ========== 제출 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitRequest {
        private String content;
    }

    // ========== 제출 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionResponse {
        private Long id;
        private Long studentInfoId;
        private String studentName;
        private String studentNumber;
        private String content;
        private String attachmentUrl;
        private String attachmentOriginalName;
        private LocalDateTime submittedAt;
        private Integer score;
        private String feedback;
        private HomeworkSubmission.SubmissionStatus status;

        public static SubmissionResponse fromEntity(HomeworkSubmission submission) {
            return SubmissionResponse.builder()
                    .id(submission.getId())
                    .studentInfoId(submission.getStudent().getId())
                    .studentName(submission.getStudent().getUser().getName())
                    .studentNumber(submission.getStudent().getFullStudentNumber())
                    .content(submission.getContent())
                    .attachmentUrl(submission.getAttachmentUrl() != null ? FileManager.UploadType.HOMEWORK.toUrl(submission.getAttachmentUrl()) : null)
                    .attachmentOriginalName(submission.getAttachmentOriginalName())
                    .submittedAt(submission.getSubmittedAt())
                    .score(submission.getScore())
                    .feedback(submission.getFeedback())
                    .status(submission.getStatus())
                    .build();
        }
    }

    // ========== 채점 요청 ==========
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradeRequest {
        private Integer score;
        private String feedback;
    }
}
