package com.example.schoolmate.global.util;

import com.example.schoolmate.domain.log.entity.SchoolmateLog;
import com.example.schoolmate.domain.log.service.LogService;

import jakarta.annotation.PostConstruct;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

/**
 * 로그 기록 정적 유틸리티
 *
 * LogService를 직접 주입받지 않고 어디서든 로그를 기록할 수 있다.
 *
 * 사용 예시:
 *   LogHelper.action("관리자명", "CREATE", "교사 홍길동", "교사 계정 생성");
 *   LogHelper.access("user@email.com", "127.0.0.1", userAgent, "LOGIN");
 *   LogHelper.classroom(classroomId, "관리자명", "ASSIGN", "담임 배정");
 */
@Component
@RequiredArgsConstructor
@Log4j2
public class LogHelper {

    private final LogService logService;
    private static LogHelper instance;

    @PostConstruct
    private void init() {
        instance = this;
    }

    /** 관리자 작업 이력 */
    public static void action(String adminName, String actionType, String target, String description) {
        if (instance == null) {
            log.warn("[LogHelper] 아직 초기화되지 않았습니다. 로그 기록 스킵.");
            return;
        }
        instance.logService.logAction(adminName, actionType, target, description);
    }

    /** 접속 이력 */
    public static void access(String username, String ip, String userAgent, String accessType) {
        if (instance == null) {
            log.warn("[LogHelper] 아직 초기화되지 않았습니다. 로그 기록 스킵.");
            return;
        }
        instance.logService.logAccess(username, ip, userAgent, accessType);
    }

    /** 학급 변경 이력 기록 */
    public static void classroom(Long classroomId, String actorName, String actionType, String description) {
        if (instance == null) {
            log.warn("[LogHelper] 아직 초기화되지 않았습니다. 로그 기록 스킵.");
            return;
        }
        instance.logService.logClassroomChange(classroomId, actorName, actionType, description);
    }

    /** 학급 변경 이력 조회 */
    public static List<SchoolmateLog> getClassroomHistory(Long classroomId) {
        if (instance == null) {
            log.warn("[LogHelper] 아직 초기화되지 않았습니다. 빈 목록 반환.");
            return Collections.emptyList();
        }
        return instance.logService.getClassroomHistory(classroomId);
    }
}
