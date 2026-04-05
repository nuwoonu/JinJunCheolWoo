package com.example.schoolmate.domain.quiz.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.schoolmate.domain.quiz.entity.QuestionType;
import com.example.schoolmate.domain.quiz.entity.Quiz;
import com.example.schoolmate.domain.quiz.entity.QuizAnswer;
import com.example.schoolmate.domain.quiz.entity.QuizOption;
import com.example.schoolmate.domain.quiz.entity.QuizQuestion;
import com.example.schoolmate.domain.quiz.entity.QuizSubmission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * [woo] 퀴즈 관련 DTO 통합 클래스
 */
public class QuizDTO {

    // ========== 퀴즈 출제 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "제목은 필수입니다")
        private String title;

        private String description;

        private Integer week;

        // [woo 03/25] 수업 분반으로 변경 (과목+학급)
        @NotNull(message = "수업 분반은 필수입니다")
        private Long courseSectionId;

        @NotNull(message = "마감일은 필수입니다")
        private LocalDateTime dueDate;

        // [woo] 응시 횟수 제한 (null이면 무제한)
        private Integer maxAttempts;

        // [soojin] 수정하는 이유: 생성/수정 요청에서 제한시간 전달
        private Integer timeLimit;

        // [woo] 정답 공개 여부 (기본 true)
        private Boolean showAnswer;

        // [woo] 문제 목록
        private List<QuestionRequest> questions;
    }

    // ========== 문제 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionRequest {
        @NotBlank(message = "문제 내용은 필수입니다")
        private String questionText;

        private int questionOrder;

        private int points;

        @NotNull(message = "문제 유형은 필수입니다")
        private QuestionType questionType;

        // [woo] 단답형 정답 (쉼표 구분으로 복수 정답)
        private String correctAnswer;

        // [woo] 객관식 선택지
        private List<OptionRequest> options;

        // [soojin] 문제 해설
        private String explanation;
    }

    // ========== 선택지 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionRequest {
        private String optionText;
        private int optionOrder;
        // [woo] Boolean 래퍼 타입 사용: primitive boolean isCorrect는
        // Lombok getter가 isCorrect() → Jackson이 "correct"로 인식하는 문제 방지
        // Boolean이면 getIsCorrect() → Jackson이 "isCorrect"로 정상 인식
        private Boolean isCorrect;
    }

    // ========== 퀴즈 목록 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private Long id;
        private String title;
        private String description;
        private Integer week;
        private String teacherName;
        private String subjectName;
        private String classroomName;
        private Long classroomId;
        private Quiz.QuizStatus status;
        private LocalDateTime dueDate;
        private int questionCount;
        private int totalPoints;
        private Integer maxAttempts;
        private Integer timeLimit;
        private boolean showAnswer;
        private LocalDateTime createDate;

        // [woo] 학생용: 응시 여부, 최고 점수
        private Integer myAttemptCount;
        private Integer myBestScore;

        // [soojin] 수정하는 이유: 교사 카드형 목록 통계값 제공
        private Integer submissionCount;
        private Integer totalStudentCount;
        private Double averageScore;

        public static ListResponse fromEntity(Quiz quiz) {
            // [woo 03/25] 교사이름[과목] 형태로 표시
            String tName = quiz.getTeacher().getUser().getName();
            String sName = quiz.getTeacher().getSubject() != null ? quiz.getTeacher().getSubject().getName() : null;
            return ListResponse.builder()
                    .id(quiz.getId())
                    .title(quiz.getTitle())
                    .description(quiz.getDescription())
                    .week(quiz.getWeek())
                    .teacherName(sName != null ? tName + "[" + sName + "]" : tName)
                    .subjectName(quiz.getTeacher().getSubject() != null ? quiz.getTeacher().getSubject().getName() : null)
                    .classroomName(quiz.getClassroom().getClassName())
                    .classroomId(quiz.getClassroom().getCid())
                    .status(quiz.getStatus())
                    .dueDate(quiz.getDueDate())
                    .questionCount(quiz.getQuestions().size())
                    .totalPoints(quiz.getTotalPoints())
                    .maxAttempts(quiz.getMaxAttempts())
                    .timeLimit(quiz.getTimeLimit())
                    .showAnswer(quiz.isShowAnswer())
                    .createDate(quiz.getCreateDate())
                    .build();
        }
    }

    // ========== 퀴즈 상세 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailResponse {
        private Long id;
        private String title;
        private String description;
        private Integer week;
        private String teacherName;
        private Long teacherUserId;
        private String classroomName;
        private Long classroomId;
        private Quiz.QuizStatus status;
        private LocalDateTime dueDate;
        private int totalPoints;
        private Integer maxAttempts;
        private Integer timeLimit;
        private boolean showAnswer;
        private LocalDateTime createDate;

        // [woo] 문제 목록 (교사용: 정답 포함 / 학생용: 정답 제외)
        private List<QuestionResponse> questions;

        // [woo] 교사용: 응시 현황
        private List<SubmissionResponse> submissions;

        // [woo] 학생용: 본인 응시 결과
        private List<SubmissionResponse> mySubmissions;

        // [soojin] 교사용: 학급 전체 학생 (응시 + 미응시 포함)
        private List<StudentWithSubmissionResponse> allStudents;

        public static DetailResponse fromEntity(Quiz quiz) {
            // [woo 03/25] 교사이름[과목] 형태로 표시
            String tName = quiz.getTeacher().getUser().getName();
            String sName = quiz.getTeacher().getSubject() != null ? quiz.getTeacher().getSubject().getName() : null;
            return DetailResponse.builder()
                    .id(quiz.getId())
                    .title(quiz.getTitle())
                    .description(quiz.getDescription())
                    .week(quiz.getWeek())
                    .teacherName(sName != null ? tName + "[" + sName + "]" : tName)
                    .teacherUserId(quiz.getTeacher().getUser().getUid())
                    .classroomName(quiz.getClassroom().getClassName())
                    .classroomId(quiz.getClassroom().getCid())
                    .status(quiz.getStatus())
                    .dueDate(quiz.getDueDate())
                    .totalPoints(quiz.getTotalPoints())
                    .maxAttempts(quiz.getMaxAttempts())
                    .timeLimit(quiz.getTimeLimit())
                    .showAnswer(quiz.isShowAnswer())
                    .createDate(quiz.getCreateDate())
                    .build();
        }
    }

    // ========== 문제 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private Long id;
        private String questionText;
        private int questionOrder;
        private int points;
        private QuestionType questionType;
        // [woo] 교사용/결과용: 정답 (풀기 화면에서는 null)
        private String correctAnswer;
        private List<OptionResponse> options;
        // [soojin] 교사용/결과용: 해설 (풀기 화면에서는 null)
        private String explanation;

        public static QuestionResponse fromEntity(QuizQuestion q, boolean includeAnswer) {
            List<OptionResponse> opts = q.getOptions().stream()
                    .map(o -> OptionResponse.fromEntity(o, includeAnswer))
                    .toList();

            return QuestionResponse.builder()
                    .id(q.getId())
                    .questionText(q.getQuestionText())
                    .questionOrder(q.getQuestionOrder())
                    .points(q.getPoints())
                    .questionType(q.getQuestionType())
                    .correctAnswer(includeAnswer ? q.getCorrectAnswer() : null)
                    .explanation(includeAnswer ? q.getExplanation() : null)
                    .options(opts)
                    .build();
        }
    }

    // ========== 선택지 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResponse {
        private Long id;
        private String optionText;
        private int optionOrder;
        // [woo] 교사용/결과용: 정답 여부 (풀기 화면에서는 null)
        private Boolean isCorrect;

        public static OptionResponse fromEntity(QuizOption o, boolean includeAnswer) {
            return OptionResponse.builder()
                    .id(o.getId())
                    .optionText(o.getOptionText())
                    .optionOrder(o.getOptionOrder())
                    .isCorrect(includeAnswer ? o.isCorrect() : null)
                    .build();
        }
    }

    // ========== 퀴즈 제출 요청 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitRequest {
        private List<AnswerRequest> answers;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerRequest {
        private Long questionId;
        // [woo] 객관식: 선택한 옵션 ID
        private Long selectedOptionId;
        // [woo] 단답형: 입력한 답
        private String answerText;
    }

    // ========== 응시 결과 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionResponse {
        private Long id;
        private Long studentInfoId;
        private String studentName;
        private String studentNumber;
        private int score;
        private int totalPoints;
        private int attemptNumber;
        private LocalDateTime submittedAt;
        private List<AnswerResponse> answers;

        public static SubmissionResponse fromEntity(QuizSubmission sub, boolean includeAnswers) {
            SubmissionResponseBuilder builder = SubmissionResponse.builder()
                    .id(sub.getId())
                    .studentInfoId(sub.getStudent().getId())
                    .studentName(sub.getStudent().getUser().getName())
                    .studentNumber(sub.getStudent().getFullStudentNumber())
                    .score(sub.getScore())
                    .totalPoints(sub.getTotalPoints())
                    .attemptNumber(sub.getAttemptNumber())
                    .submittedAt(sub.getSubmittedAt());

            if (includeAnswers) {
                builder.answers(sub.getAnswers().stream()
                        .map(AnswerResponse::fromEntity)
                        .toList());
            }

            return builder.build();
        }
    }

    // ========== [soojin] 학급 전체 학생 응시 현황 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentWithSubmissionResponse {
        private Long studentInfoId;
        private String studentName;
        private String studentNumber;
        // [soojin] true: 응시완료, false: 미응시
        private boolean submitted;
        // [soojin] 미응시 학생은 null
        private SubmissionResponse latestSubmission;
    }

    // ========== 개별 답안 응답 ==========
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerResponse {
        private Long questionId;
        private String questionText;
        private Long selectedOptionId;
        private String answerText;
        // [woo] Boolean 래퍼 타입: getIsCorrect() → Jackson이 "isCorrect"로 직렬화 (primitive boolean이면 "correct"로 직렬화되어 프론트에서 인식 불가)
        private Boolean isCorrect;
        private int earnedPoints;

        public static AnswerResponse fromEntity(QuizAnswer a) {
            return AnswerResponse.builder()
                    .questionId(a.getQuestion().getId())
                    .questionText(a.getQuestion().getQuestionText())
                    .selectedOptionId(a.getSelectedOption() != null ? a.getSelectedOption().getId() : null)
                    .answerText(a.getAnswerText())
                    .isCorrect(a.isCorrect())
                    .earnedPoints(a.getEarnedPoints())
                    .build();
        }
    }
}
