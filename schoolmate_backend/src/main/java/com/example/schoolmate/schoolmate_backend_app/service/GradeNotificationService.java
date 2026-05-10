package com.example.schoolmate.schoolmate_backend_app.service;

import com.example.schoolmate.domain.parent.entity.FamilyRelation;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.TestType;
import com.example.schoolmate.domain.parent.repository.FamilyRelationRepository;
import com.example.schoolmate.global.util.NotificationHelper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

// [woo] 성적 등록/수정 시 학부모에게 알림 (DB 저장 + Expo 푸시)
@Slf4j
@Service
@RequiredArgsConstructor
public class GradeNotificationService {

    private final FamilyRelationRepository familyRelationRepository;
    private final ExpoPushService expoPushService;

    @Async
    public void notifyParentsOnGradeInput(StudentInfo student, String subjectName,
            TestType testType, Double score) {
        String title = "성적 등록 알림";
        String content = String.format("[%s] 성적이 등록되었습니다.", subjectName);
        String actionUrl = "/parent/grades?child=" + student.getId();

        sendToParents(student, title, content, actionUrl);
    }

    @Async
    public void notifyParentsOnGradeUpdate(StudentInfo student, String subjectName,
            TestType testType, Double newScore) {
        String title = "성적 변경 알림";
        String content = String.format("%s의 %s %s 성적이 변경되었습니다. (%s점)",
                student.getUser().getName(),
                subjectName,
                getTestTypeLabel(testType),
                formatScore(newScore));
        String actionUrl = "/parent/grades?child=" + student.getId();

        sendToParents(student, title, content, actionUrl);
    }

    private void sendToParents(StudentInfo student, String title, String content, String actionUrl) {
        try {
            List<FamilyRelation> relations = familyRelationRepository
                    .findByStudentInfo_User_Uid(student.getUser().getUid());

            if (relations.isEmpty()) {
                log.debug("[woo] 학부모 없음 — 알림 스킵 (학생: {})", student.getUser().getName());
                return;
            }

            for (FamilyRelation relation : relations) {
                User parentUser = relation.getParentInfo().getUser();
                if (parentUser == null) {
                    continue;
                }

                // [woo] 1) DB에 알림 저장 → 포그라운드 폴링으로 앱에서 감지
                NotificationHelper.send(null, parentUser, title, content, actionUrl);

                // [woo] 2) Expo Push → FCM → OS 상단바 알림 (토큰 등록된 경우)
                expoPushService.sendPush(parentUser, title, content, actionUrl);

                log.info("[woo] 성적 알림 발송: parent={} (uid={}), student={}",
                        parentUser.getName(), parentUser.getUid(), student.getUser().getName());
            }

            log.info("[woo] 성적 알림 처리 완료 — 학생: {}, 학부모 {}명",
                    student.getUser().getName(), relations.size());

        } catch (Exception e) {
            log.error("[woo] 성적 알림 발송 실패 — 학생: {}", student.getUser().getName(), e);
        }
    }

    private String getTestTypeLabel(TestType type) {
        return switch (type) {
            case MIDTERMTEST -> "중간고사";
            case FINALTEST -> "기말고사";
            case QUIZ -> "퀴즈";
            case HOMEWORK -> "과제";
            case PERFORMANCEASSESSMENT -> "수행평가";
        };
    }

    private String formatScore(Double score) {
        if (score == null)
            return "-";
        return score == Math.floor(score) ? String.valueOf(score.intValue()) : String.valueOf(score);
    }
}
