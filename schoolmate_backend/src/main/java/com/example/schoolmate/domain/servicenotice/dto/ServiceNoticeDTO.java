package com.example.schoolmate.domain.servicenotice.dto;

import com.example.schoolmate.domain.servicenotice.entity.ServiceNotice;
import lombok.*;

import java.time.LocalDateTime;

public class ServiceNoticeDTO {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private Long id;
        private String title;
        private String writerName;
        private int viewCount;
        private boolean isPinned;
        private LocalDateTime createDate;

        public static Summary fromEntity(ServiceNotice e) {
            return Summary.builder()
                    .id(e.getId())
                    .title(e.getTitle())
                    .writerName(e.getWriterName())
                    .viewCount(e.getViewCount())
                    .isPinned(e.isPinned())
                    .createDate(e.getCreateDate())
                    .build();
        }
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Detail {
        private Long id;
        private String title;
        private String content;
        private String writerName;
        private int viewCount;
        private boolean isPinned;
        private LocalDateTime createDate;
        private LocalDateTime updateDate;

        public static Detail fromEntity(ServiceNotice e) {
            return Detail.builder()
                    .id(e.getId())
                    .title(e.getTitle())
                    .content(e.getContent())
                    .writerName(e.getWriterName())
                    .viewCount(e.getViewCount())
                    .isPinned(e.isPinned())
                    .createDate(e.getCreateDate())
                    .updateDate(e.getUpdateDate())
                    .build();
        }
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private String title;
        private String content;
        private boolean isPinned;
    }
}
