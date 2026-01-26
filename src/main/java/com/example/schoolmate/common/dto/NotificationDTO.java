package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.notification.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.format.DateTimeFormatter;

public class NotificationDTO {
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendRequest {
        private Long senderUid; // 발신자 UID (테스트용, 실제로는 로그인한 관리자 ID 사용)
        private Long receiverUid; // 수신자 UID (학부모 등)
        private String title;
        private String content;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class NotificationHistory {
        private String title;
        private String content;
        private String senderName;
        private String sentDate;
        private boolean isRead;

        public NotificationHistory(Notification n) {
            this.title = n.getTitle();
            this.content = n.getContent();
            this.senderName = n.getSender() != null ? n.getSender().getName() : "시스템";
            this.sentDate = n.getCreateDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            this.isRead = n.isRead();
        }
    }
}