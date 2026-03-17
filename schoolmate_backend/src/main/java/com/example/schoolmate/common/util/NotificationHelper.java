package com.example.schoolmate.common.util;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.service.NotificationService;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

/**
 * 알림 발송 정적 유틸리티
 *
 * NotificationService를 직접 주입받지 않고 어디서든 알림을 발송할 수 있다.
 *
 * 사용 예시:
 *   NotificationHelper.send(receiver, "제목", "내용");
 *   NotificationHelper.send(sender, receiver, "제목", "내용");
 */
@Component
@RequiredArgsConstructor
@Log4j2
public class NotificationHelper {

    private final NotificationService notificationService;
    private static NotificationHelper instance;

    @PostConstruct
    private void init() {
        instance = this;
    }

    /** 시스템 알림 (발신자 없음) */
    public static void send(User receiver, String title, String content) {
        send(null, receiver, title, content, null);
    }

    /** 발신자 지정 알림 */
    public static void send(User sender, User receiver, String title, String content) {
        send(sender, receiver, title, content, null);
    }

    /** 클릭 시 특정 페이지로 이동하는 알림 (발신자 없음) */
    public static void send(User receiver, String title, String content, String actionUrl) {
        send(null, receiver, title, content, actionUrl);
    }

    /** 클릭 시 특정 페이지로 이동하는 알림 (발신자 지정) */
    public static void send(User sender, User receiver, String title, String content, String actionUrl) {
        if (instance == null) {
            log.warn("[NotificationHelper] 아직 초기화되지 않았습니다. 알림 발송 스킵.");
            return;
        }
        instance.notificationService.notifyUser(sender, receiver, title, content, actionUrl);
    }
}
