package com.example.schoolmate.domain.dailysummary.service;

// [woo] GPT 요약 생성에 필요한 컨텍스트 데이터 묶음

import java.time.LocalDate;
import java.util.List;

import com.example.schoolmate.domain.attendance.entity.StudentAttendance;
import com.example.schoolmate.domain.dailysummary.entity.DailyNote;
import com.example.schoolmate.domain.homework.entity.HomeworkSubmission;
import com.example.schoolmate.domain.quiz.entity.QuizSubmission;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SummaryContext {

    private final String studentName;
    private final LocalDate date;

    // 출결 (null이면 미기록)
    private final StudentAttendance attendance;

    // 미제출 마감 과제 제목 목록
    private final List<String> overdueHomeworkTitles;

    // 최근 채점된 과제 (최대 3개)
    private final List<HomeworkSubmission> recentGradedHomework;

    // 최근 퀴즈 응시 결과 (최대 3개)
    private final List<QuizSubmission> recentQuizSubmissions;

    // 교사 일일 태그 메모 (선택 입력)
    private final DailyNote dailyNote;

    /**
     * [woo] 아무 활동도 없으면 요약 생성 의미 없음 (방학/공휴일 등)
     * 출결 기록이 있거나, 교사가 메모를 남긴 경우에만 생성
     */
    public boolean hasAnyActivity() {
        // [woo] 태그 또는 메모 중 하나라도 있으면 활동으로 간주
        boolean hasNote = dailyNote != null && (
                (dailyNote.getTags() != null && !dailyNote.getTags().isBlank()) ||
                (dailyNote.getMemo() != null && !dailyNote.getMemo().isBlank())
        );
        return attendance != null
                || hasNote
                || (overdueHomeworkTitles != null && !overdueHomeworkTitles.isEmpty())
                || (recentGradedHomework != null && !recentGradedHomework.isEmpty())
                || (recentQuizSubmissions != null && !recentQuizSubmissions.isEmpty());
    }
}
