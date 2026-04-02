package com.example.schoolmate.common.service;

import java.security.Security;
import java.util.List;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.notification.PushSubscription;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.notice.PushSubscriptionRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;

@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private final PushSubscriptionRepository pushSubscriptionRepository;

    @Value("${vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${vapid.private-key:}")
    private String vapidPrivateKey;

    private PushService pushService;

    @PostConstruct
    public void init() {
        if (vapidPublicKey.isBlank() || vapidPrivateKey.isBlank()) {
            log.warn("[Push] VAPID 키가 설정되지 않았습니다. 푸쉬 알림이 비활성화됩니다.");
            log.warn("[Push] VapidKeyGenerator를 실행해 키를 생성한 뒤 application-secret.properties에 설정하세요.");
            return;
        }
        try {
            Security.addProvider(new BouncyCastleProvider());
            this.pushService = new PushService(vapidPublicKey, vapidPrivateKey);
            log.info("[Push] PushService 초기화 완료");
        } catch (Exception e) {
            log.error("[Push] PushService 초기화 실패: {}", e.getMessage());
        }
    }

    // 특정 유저에게 푸쉬 알림 전송 (구독 정보가 없으면 조용히 스킵)
    // User 객체 대신 uid로 조회 → 같은 트랜잭션 내 transient User로 인한 flush 오류 방지
    @Transactional
    public void sendToUser(User receiver, String title, String body, String actionUrl) {
        if (pushService == null) return;
        if (receiver == null || receiver.getUid() == null) return;

        List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUserUid(receiver.getUid());
        if (subscriptions.isEmpty()) return;

        String payload = buildPayload(title, body, actionUrl);

        for (PushSubscription sub : subscriptions) {
            sendToSubscription(sub, payload);
        }
    }

    private void sendToSubscription(PushSubscription sub, String payload) {
        try {
            Notification notification = new Notification(
                    sub.getEndpoint(),
                    sub.getP256dhKey(),
                    sub.getAuthKey(),
                    payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            org.apache.http.HttpResponse response = pushService.send(notification);
            int statusCode = response.getStatusLine().getStatusCode();

            // 410 Gone / 404 Not Found → 만료된 구독, DB에서 삭제
            if (statusCode == 410 || statusCode == 404) {
                log.info("[Push] 만료된 구독 삭제: endpoint={}", sub.getEndpoint());
                pushSubscriptionRepository.delete(sub);
            } else if (statusCode != 201) {
                log.warn("[Push] 전송 실패 (status={}): endpoint={}", statusCode, sub.getEndpoint());
            }
        } catch (Exception e) {
            log.error("[Push] 전송 중 예외 발생: {}", e.getMessage());
        }
    }

    private String buildPayload(String title, String body, String actionUrl) {
        String safeTitle = escape(title);
        String safeBody = escape(body);
        String safeUrl = (actionUrl != null) ? escape(actionUrl) : "/hub";
        return String.format(
                "{\"title\":\"%s\",\"body\":\"%s\",\"icon\":\"/images/pwa-icon-512.svg\",\"badge\":\"/images/pwa-icon-512.svg\",\"data\":{\"actionUrl\":\"%s\"}}",
                safeTitle, safeBody, safeUrl);
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
