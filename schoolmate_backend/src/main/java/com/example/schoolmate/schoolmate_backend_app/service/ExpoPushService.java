package com.example.schoolmate.schoolmate_backend_app.service;

import com.example.schoolmate.schoolmate_backend_app.entity.DevicePushToken;
import com.example.schoolmate.schoolmate_backend_app.entity.NotificationPreference;
import com.example.schoolmate.schoolmate_backend_app.repository.DevicePushTokenRepository;
import com.example.schoolmate.schoolmate_backend_app.repository.NotificationPreferenceRepository;
import com.example.schoolmate.domain.user.entity.User;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpoPushService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private static final int BATCH_SIZE = 100;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final DevicePushTokenRepository pushTokenRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Transactional
    public void registerToken(User user, String token, String platform) {
        Optional<DevicePushToken> existing = pushTokenRepository.findByToken(token);
        if (existing.isPresent()) {
            DevicePushToken dt = existing.get();
            if (!dt.getUser().getUid().equals(user.getUid())) {
                dt.setUser(user);
                dt.setPlatform(platform);
            }
            return;
        }

        DevicePushToken dt = new DevicePushToken();
        dt.setUser(user);
        dt.setToken(token);
        dt.setPlatform(platform);
        pushTokenRepository.save(dt);
        log.info("[woo] 푸시 토큰 등록 - uid: {}, platform: {}", user.getUid(), platform);
    }

    @Transactional
    public void unregisterToken(String token) {
        pushTokenRepository.deleteByToken(token);
    }

    @Async
    public void sendPush(User receiver, String title, String body) {
        sendPush(receiver, title, body, null);
    }

    @Async
    public void sendPush(User receiver, String title, String body, String actionUrl) {
        // [woo] 조건 없이 무조건 발송
        List<DevicePushToken> tokens = pushTokenRepository.findByUser(receiver);
        if (tokens.isEmpty()) {
            log.debug("[woo] 푸시 토큰 없음 - uid: {}", receiver.getUid());
            return;
        }

        List<String> tokenStrs = tokens.stream()
                .map(DevicePushToken::getToken)
                .collect(Collectors.toList());
        sendToTokens(tokenStrs, title, body, actionUrl);
    }

    @Async
    public void sendPushToUsers(Collection<User> receivers, String title, String body) {
        sendPushToUsers(receivers, title, body, null);
    }

    @Async
    public void sendPushToUsers(Collection<User> receivers, String title, String body, String actionUrl) {
        if (receivers == null || receivers.isEmpty()) return;

        // [woo] 조건 없이 무조건 발송 — 모든 수신자 토큰 조회
        Set<Long> uids = receivers.stream()
                .map(User::getUid)
                .collect(Collectors.toSet());

        List<DevicePushToken> allTokens = pushTokenRepository.findByUserUidIn(uids);
        if (allTokens.isEmpty()) return;

        List<String> tokenStrs = allTokens.stream()
                .map(DevicePushToken::getToken)
                .collect(Collectors.toList());
        sendToTokens(tokenStrs, title, body, actionUrl);
    }

    private boolean isQuietForUser(Long uid) {
        Optional<NotificationPreference> opt = preferenceRepository.findByUserUid(uid);
        if (opt.isEmpty()) return false;

        NotificationPreference pref = opt.get();
        if (!pref.isPushEnabled()) return true;

        if (!pref.isQuietHoursEnabled()) return false;

        return isInQuietHours(pref.getQuietStart(), pref.getQuietEnd());
    }

    private Set<Long> getQuietUserUids(Set<Long> uids) {
        List<NotificationPreference> prefs = preferenceRepository.findByUserUidIn(uids);
        Set<Long> quietUids = new HashSet<>();

        for (NotificationPreference pref : prefs) {
            if (!pref.isPushEnabled()) {
                quietUids.add(pref.getUser().getUid());
            } else if (pref.isQuietHoursEnabled() &&
                       isInQuietHours(pref.getQuietStart(), pref.getQuietEnd())) {
                quietUids.add(pref.getUser().getUid());
            }
        }
        return quietUids;
    }

    private boolean isInQuietHours(LocalTime start, LocalTime end) {
        LocalTime now = ZonedDateTime.now(KST).toLocalTime();
        if (start.isAfter(end)) {
            return !now.isBefore(start) || now.isBefore(end);
        } else {
            return !now.isBefore(start) && now.isBefore(end);
        }
    }

    private void sendToTokens(List<String> tokens, String title, String body, String actionUrl) {
        for (int i = 0; i < tokens.size(); i += BATCH_SIZE) {
            List<String> batch = tokens.subList(i, Math.min(i + BATCH_SIZE, tokens.size()));
            sendBatch(batch, title, body, actionUrl);
        }
    }

    private void sendBatch(List<String> tokens, String title, String body, String actionUrl) {
        try {
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < tokens.size(); i++) {
                if (i > 0) json.append(",");
                json.append("{");
                json.append("\"to\":\"").append(escapeJson(tokens.get(i))).append("\",");
                json.append("\"sound\":\"default\",");
                json.append("\"title\":\"").append(escapeJson(title)).append("\",");
                json.append("\"body\":\"").append(escapeJson(body)).append("\"");
                if (actionUrl != null) {
                    json.append(",\"data\":{\"actionUrl\":\"").append(escapeJson(actionUrl)).append("\"}");
                }
                json.append("}");
            }
            json.append("]");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(EXPO_PUSH_URL))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("[woo] Expo Push 응답 오류 - status: {}, body: {}", response.statusCode(), response.body());
            } else {
                log.info("[woo] Expo Push 전송 완료 - {}건, body: {}", tokens.size(), response.body()); // [woo] info로 변경
            }
        } catch (Exception e) {
            log.error("[woo] Expo Push 전송 실패", e);
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
