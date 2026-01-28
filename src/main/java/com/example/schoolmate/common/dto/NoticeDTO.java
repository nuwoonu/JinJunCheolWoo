package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.SchoolNotice;
import lombok.*;

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
}