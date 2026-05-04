package com.example.schoolmate.domain.dailysummary.service;

// [woo] 자녀 하루 요약 핵심 서비스
// 매일 오후 4시 스케줄러 → 학생별 데이터 수집 → GPT 요약 생성 → DB 저장 → 학부모 FCM 푸시
// 데이터 소스: 출결 + 과제 제출/점수 + 퀴즈 점수 + 교사 일일 태그 메모(선택)

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.attendance.entity.StudentAttendance;
import com.example.schoolmate.domain.attendance.repository.AttendanceRepository;
import com.example.schoolmate.domain.dailysummary.entity.ChildDailySummary;
import com.example.schoolmate.domain.dailysummary.entity.DailyNote;
import com.example.schoolmate.domain.dailysummary.repository.ChildDailySummaryRepository;
import com.example.schoolmate.domain.dailysummary.repository.DailyNoteRepository;
import com.example.schoolmate.domain.homework.entity.HomeworkSubmission;
import com.example.schoolmate.domain.homework.repository.HomeworkSubmissionRepository;
import com.example.schoolmate.domain.notification.service.NotificationService;
import com.example.schoolmate.domain.parent.entity.FamilyRelation;
import com.example.schoolmate.domain.parent.repository.FamilyRelationRepository;
import com.example.schoolmate.domain.quiz.entity.QuizSubmission;
import com.example.schoolmate.domain.quiz.repository.QuizSubmissionRepository;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailySummaryService {

    private final StudentInfoRepository studentInfoRepository;
    private final AttendanceRepository attendanceRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;
    private final DailyNoteRepository dailyNoteRepository;
    private final ChildDailySummaryRepository childDailySummaryRepository;
    private final FamilyRelationRepository familyRelationRepository;
    // [woo] OpenAI GPT 사용 (서버 환경변수 anthropic.api-key 미적용으로 전환)
    private final OpenAiSummaryService openAiSummaryService;
    private final NotificationService notificationService;

    /**
     * [woo] 특정 날짜의 전체 학생 요약 생성 (스케줄러 호출)
     * 이미 생성된 학생은 건너뜀 (중복 방지)
     */
    @Transactional
    public void generateAllSummaries(LocalDate date) {
        List<StudentInfo> students = studentInfoRepository.findAll();
        log.info("[woo] 하루 요약 생성 시작: {} - 총 {}명", date, students.size());

        int success = 0, skipped = 0, failed = 0;
        for (StudentInfo student : students) {
            // 이미 생성된 경우 스킵
            if (childDailySummaryRepository.findByStudentIdAndSummaryDate(student.getId(), date).isPresent()) {
                skipped++;
                continue;
            }
            try {
                generateSummaryForStudent(student, date);
                success++;
            } catch (Exception e) {
                log.warn("[woo] 요약 생성 실패 - studentId={}: {}", student.getId(), e.getMessage());
                failed++;
            }
        }
        log.info("[woo] 하루 요약 완료: 성공={}, 스킵={}, 실패={}", success, skipped, failed);
    }

    /**
     * [woo] 특정 학생 하루 요약 생성 + 학부모 FCM 푸시
     */
    @Transactional
    public void generateSummaryForStudent(StudentInfo student, LocalDate date) {
        generateAndSaveSummary(student, date, false);
    }

    private void generateAndSaveSummary(StudentInfo student, LocalDate date, boolean replaceExisting) {
        SummaryContext ctx = collectContext(student, date);

        // 아무 활동도 없으면 요약 생성 스킵 (출결도 없는 방학/공휴일)
        if (!ctx.hasAnyActivity()) {
            log.debug("[woo] 활동 없음 스킵 - studentId={}, date={}", student.getId(), date);
            return;
        }

        String summaryText = openAiSummaryService.generateSummary(ctx);

        if (replaceExisting) {
            childDailySummaryRepository.findByStudentIdAndSummaryDate(student.getId(), date)
                    .ifPresent(childDailySummaryRepository::delete);
            childDailySummaryRepository.flush();
        }

        ChildDailySummary summary = ChildDailySummary.builder()
                .student(student)
                .summaryDate(date)
                .content(summaryText)
                .build();
        childDailySummaryRepository.save(summary);

        // [woo] 연결된 모든 학부모에게 FCM 푸시 + 앱 내 알림
        pushToParents(student, summary);
        summary.markPushed();
    }

    /**
     * [woo] 학생 데이터 수집
     * - 출결: 당일 기록
     * - 과제: 마감된 미제출 과제 + 최근 채점 완료 3개
     * - 퀴즈: 오늘 응시한 결과 (없으면 최근 3개)
     * - 교사 태그 메모: 당일 선택 입력
     */
    private SummaryContext collectContext(StudentInfo student, LocalDate date) {
        // 출결
        Optional<StudentAttendance> attendance = attendanceRepository
                .findByStudentAndDateRange(student.getId(), date, date)
                .stream().findFirst();

        // 마감된 미제출 과제 제목 목록
        List<String> overdueHomeworkTitles = homeworkSubmissionRepository
                .findOverdueNotSubmittedTitles(student.getId());

        // 최근 채점 완료 과제 (최대 3개)
        List<HomeworkSubmission> recentGraded = homeworkSubmissionRepository
                .findRecentGradedByStudent(student.getId(), PageRequest.of(0, 3));

        // 오늘 응시한 퀴즈, 없으면 최근 3개
        List<QuizSubmission> quizSubmissions = quizSubmissionRepository
                .findAllByStudentIdAndDate(student.getId(), date);
        if (quizSubmissions.isEmpty()) {
            quizSubmissions = quizSubmissionRepository
                    .findRecentByStudent(student.getId(), PageRequest.of(0, 3));
        }

        // 교사 일일 태그 메모 (선택사항)
        Optional<DailyNote> dailyNote = dailyNoteRepository
                .findByStudentIdAndNoteDate(student.getId(), date);

        return SummaryContext.builder()
                .studentName(student.getUser() != null ? student.getUser().getName() : "학생")
                .date(date)
                .attendance(attendance.orElse(null))
                .overdueHomeworkTitles(overdueHomeworkTitles)
                .recentGradedHomework(recentGraded)
                .recentQuizSubmissions(quizSubmissions)
                .dailyNote(dailyNote.orElse(null))
                .build();
    }

    /**
     * [woo] 학부모에게 FCM 푸시 + 앱 내 알림 저장
     */
    private void pushToParents(StudentInfo student, ChildDailySummary summary) {
        List<FamilyRelation> relations = familyRelationRepository.findByStudentInfoId(student.getId());
        String studentName = student.getUser() != null ? student.getUser().getName() : "자녀";
        String title = studentName + "의 오늘 하루 요약이 도착했어요";
        // 알림 본문은 요약 첫 문장만 (최대 80자)
        String preview = summary.getContent().length() > 80
                ? summary.getContent().substring(0, 80) + "..."
                : summary.getContent();

        for (FamilyRelation rel : relations) {
            if (rel.getParentInfo() == null || rel.getParentInfo().getUser() == null) continue;
            try {
                notificationService.notifyUser(
                        null,                          // 시스템 발신
                        rel.getParentInfo().getUser(),
                        title,
                        preview,
                        "/daily-summary/" + student.getId() // 앱 딥링크
                );
            } catch (Exception e) {
                log.warn("[woo] 학부모 알림 전송 실패 - parentUid={}: {}",
                        rel.getParentInfo().getUser().getUid(), e.getMessage());
            }
        }
    }

    /**
     * [woo] 교사 메모 저장 시 즉시 요약 재생성 — 백그라운드 비동기 실행
     * studentId를 받아 내부에서 새로 조회 (@Async 스레드에 detached 엔티티 전달 방지)
     */
    @Async
    @Transactional
    public void triggerSummaryAsync(Long studentId, LocalDate date) {
        try {
            StudentInfo student = studentInfoRepository.findByIdWithUser(studentId).orElse(null);
            if (student == null) return;
            regenerateSummaryForStudent(student, date);
        } catch (Exception e) {
            log.warn("[woo] 즉시 요약 재생성 실패 - studentId={}, date={}: {}", studentId, date, e.getMessage());
        }
    }

    /**
     * [woo] 교사/데모용 - 특정 학생 즉시 요약 강제 재생성 (기존 당일 요약 삭제 후 새로 생성)
     */
    @Transactional
    public void regenerateSummaryForStudent(StudentInfo student, LocalDate date) {
        // 새 요약 생성이 성공한 뒤 기존 요약을 교체해 실패 시 빈 상태가 되지 않게 한다.
        StudentInfo managedStudent = studentInfoRepository.findByIdWithUser(student.getId())
                .orElse(student);
        generateAndSaveSummary(managedStudent, date, true);
    }

    /**
     * [woo] 학부모 앱 - 특정 학생의 요약 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ChildDailySummary> getSummariesForStudent(Long studentInfoId) {
        return childDailySummaryRepository.findByStudentIdOrderBySummaryDateDesc(studentInfoId);
    }

    /**
     * [woo] 학부모 앱 - 특정 날짜 요약 단건 조회
     */
    @Transactional(readOnly = true)
    public Optional<ChildDailySummary> getSummary(Long studentInfoId, LocalDate date) {
        return childDailySummaryRepository.findByStudentIdAndSummaryDate(studentInfoId, date);
    }
}
