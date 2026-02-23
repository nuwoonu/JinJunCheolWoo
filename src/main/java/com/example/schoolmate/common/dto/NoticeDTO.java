package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.SchoolNotice;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class NoticeDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        private Long id;
        private String title;
        private String content;
        private boolean isImportant;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String title;
        private String content;
        private String writerName;
        private int viewCount;
        private boolean isImportant;
        private String createdDate;
        private String updatedDate;

        public static Response from(SchoolNotice notice) {
            return Response.builder()
                    .id(notice.getId())
                    .title(notice.getTitle())
                    .content(notice.getContent())
                    .writerName(notice.getWriter() != null ? notice.getWriter().getName() : "알 수 없음")
                    .viewCount(notice.getViewCount())
                    .isImportant(notice.isImportant())
                    .createdDate(notice.getCreateDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                    .updatedDate(notice.getUpdateDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")))
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoardNotice {
        private Long nno;

        @NotBlank(message = "제목을 입력해주세요")
        private String title;

        @NotBlank(message = "내용을 입력해주세요")
        private String content;

        private Long writerId;
        private String writerEmail;
        private String writerName;

        private LocalDateTime createDate;
        private LocalDateTime updateDate;
    }

    @Getter
    @Setter
    @ToString
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassNotice {
        private Long no;
        private String title;
        private String content;
        private Integer grade;
        private Integer classNum;
        private String writerName;
        private String attachmentUrl;
        private LocalDate createdDate;
    }

    @Getter
    @Setter
    @ToString
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NoticeToParents {
        private Long no;
        private String title;
        private String content;
        private Integer targetGrade;
        private String targetGradeText;
        private String writerName;
        private String attachmentUrl;
        private Boolean hasAttachment;
        private LocalDate createdDate;
    }
}