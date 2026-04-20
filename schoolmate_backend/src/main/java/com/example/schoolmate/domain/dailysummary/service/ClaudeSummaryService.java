package com.example.schoolmate.domain.dailysummary.service;

// [woo] Anthropic Claude (claude-sonnet-4-6) 연동 - SummaryContext → 학부모용 요약문 생성
// OpenAiSummaryService와 동일한 인터페이스, Claude Messages API 사용

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.schoolmate.domain.attendance.entity.StudentAttendance;
import com.example.schoolmate.domain.homework.entity.HomeworkSubmission;
import com.example.schoolmate.domain.quiz.entity.QuizSubmission;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ClaudeSummaryService {

    @Value("${anthropic.api-key:}")
    private String apiKey;

    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-sonnet-4-6";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private final RestTemplate restTemplate;

    public ClaudeSummaryService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * [woo] SummaryContext → 학부모용 요약 문단 생성 (Claude API)
     */
    @SuppressWarnings("unchecked")
    public String generateSummary(SummaryContext ctx) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[woo] Anthropic API 키가 설정되지 않았습니다.");
            return buildFallbackSummary(ctx);
        }

        String prompt = buildPrompt(ctx);
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);
            headers.set("anthropic-version", ANTHROPIC_VERSION);

            Map<String, Object> body = Map.of(
                    "model", MODEL,
                    "max_tokens", 300,
                    "system", "당신은 학교 알림 서비스입니다. 교사가 입력한 학생의 하루 정보를 바탕으로 "
                            + "학부모가 읽기 좋은 따뜻하고 자연스러운 한국어 요약문을 작성합니다. "
                            + "2~4문장으로 간결하게 작성하고, 학부모 입장에서 공감할 수 있는 톤으로 써주세요. "
                            + "학생 이름은 'OO이'처럼 자연스럽게 사용하세요.",
                    "messages", List.of(
                            Map.of("role", "user", "content", prompt)));

            ResponseEntity<Map> response = restTemplate.exchange(
                    API_URL, HttpMethod.POST,
                    new HttpEntity<>(body, headers), Map.class);

            if (response.getBody() == null)
                return buildFallbackSummary(ctx);

            List<Map<String, Object>> content = (List<Map<String, Object>>) response.getBody().get("content");
            if (content == null || content.isEmpty())
                return buildFallbackSummary(ctx);

            String text = (String) content.get(0).get("text");
            return text != null ? text.trim() : buildFallbackSummary(ctx);

        } catch (Exception e) {
            log.warn("[woo] Claude 요약 생성 실패: {}", e.getMessage());
            return buildFallbackSummary(ctx);
        }
    }

    /**
     * [woo] Claude 프롬프트 구성 - 수집된 컨텍스트를 읽기 쉬운 텍스트로 변환
     */
    private String buildPrompt(SummaryContext ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append("학생 이름: ").append(ctx.getStudentName()).append("\n");
        sb.append("날짜: ").append(ctx.getDate()).append("\n\n");

        // 출결
        if (ctx.getAttendance() != null) {
            StudentAttendance att = ctx.getAttendance();
            sb.append("[출결] ");
            switch (att.getStatus()) {
                case PRESENT -> sb.append("정상 출석");
                case LATE -> sb.append("지각" + (att.getReason() != null ? " (" + att.getReason() + ")" : ""));
                case ABSENT -> sb.append("결석" + (att.getReason() != null ? " (" + att.getReason() + ")" : ""));
                case EARLY_LEAVE -> sb.append("조퇴" + (att.getReason() != null ? " (" + att.getReason() + ")" : ""));
                default -> sb.append(att.getStatus().name());
            }
            if (att.getCheckInTime() != null) {
                sb.append(" (등교시간: ").append(att.getCheckInTime()).append(")");
            }
            sb.append("\n");
        } else {
            sb.append("[출결] 미기록\n");
        }

        // 미제출 마감 과제
        if (ctx.getOverdueHomeworkTitles() != null && !ctx.getOverdueHomeworkTitles().isEmpty()) {
            sb.append("[미제출 과제] ");
            sb.append(String.join(", ", ctx.getOverdueHomeworkTitles())).append("\n");
        }

        // 최근 채점된 과제
        if (ctx.getRecentGradedHomework() != null && !ctx.getRecentGradedHomework().isEmpty()) {
            sb.append("[최근 과제 점수]\n");
            for (HomeworkSubmission hw : ctx.getRecentGradedHomework()) {
                sb.append("  - ").append(hw.getHomework().getTitle())
                        .append(": ").append(hw.getScore()).append("점");
                if (hw.getFeedback() != null && !hw.getFeedback().isBlank()) {
                    sb.append(" (교사 피드백: ").append(hw.getFeedback()).append(")");
                }
                sb.append("\n");
            }
        }

        // 최근 퀴즈
        if (ctx.getRecentQuizSubmissions() != null && !ctx.getRecentQuizSubmissions().isEmpty()) {
            sb.append("[최근 퀴즈 결과]\n");
            for (QuizSubmission qs : ctx.getRecentQuizSubmissions()) {
                int pct = qs.getTotalPoints() > 0 ? (qs.getScore() * 100 / qs.getTotalPoints()) : 0;
                sb.append("  - ").append(qs.getQuiz().getTitle())
                        .append(": ").append(qs.getScore()).append("/").append(qs.getTotalPoints())
                        .append("점 (").append(pct).append("%)\n");
            }
        }

        // 교사 일일 태그 메모
        if (ctx.getDailyNote() != null) {
            if (ctx.getDailyNote().getTags() != null && !ctx.getDailyNote().getTags().isBlank()) {
                sb.append("[교사 메모 - 태그] ").append(ctx.getDailyNote().getTags()).append("\n");
            }
            if (ctx.getDailyNote().getMemo() != null && !ctx.getDailyNote().getMemo().isBlank()) {
                sb.append("[교사 메모 - 추가] ").append(ctx.getDailyNote().getMemo()).append("\n");
            }
        }

        sb.append("\n위 정보를 바탕으로 학부모에게 전달할 따뜻한 하루 요약을 작성해주세요.");
        return sb.toString();
    }

    /**
     * [woo] API 키 없거나 실패 시 기본 텍스트 생성
     */
    private String buildFallbackSummary(SummaryContext ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append(ctx.getStudentName()).append("의 오늘 하루 요약입니다.\n");

        if (ctx.getAttendance() != null) {
            switch (ctx.getAttendance().getStatus()) {
                case PRESENT -> sb.append("오늘 정상 출석했습니다.");
                case LATE -> sb.append("오늘 지각했습니다.");
                case ABSENT -> sb.append("오늘 결석했습니다.");
                case EARLY_LEAVE -> sb.append("오늘 조퇴했습니다.");
                default -> {
                }
            }
        }

        if (ctx.getOverdueHomeworkTitles() != null && !ctx.getOverdueHomeworkTitles().isEmpty()) {
            sb.append(" 미제출 과제가 ").append(ctx.getOverdueHomeworkTitles().size()).append("개 있습니다.");
        }

        return sb.toString().trim();
    }
}
