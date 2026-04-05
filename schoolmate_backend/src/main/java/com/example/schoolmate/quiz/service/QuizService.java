package com.example.schoolmate.quiz.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.info.FamilyRelationRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.domain.term.entity.CourseSection;
import com.example.schoolmate.domain.term.repository.CourseSectionRepository;
import com.example.schoolmate.dto.CustomUserDTO;
import com.example.schoolmate.quiz.dto.QuizDTO;
import com.example.schoolmate.quiz.entity.QuestionType;
import com.example.schoolmate.quiz.entity.Quiz;
import com.example.schoolmate.quiz.entity.QuizAnswer;
import com.example.schoolmate.quiz.entity.QuizOption;
import com.example.schoolmate.quiz.entity.QuizQuestion;
import com.example.schoolmate.quiz.entity.QuizSubmission;
import com.example.schoolmate.quiz.repository.QuizRepository;
import com.example.schoolmate.quiz.repository.QuizSubmissionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [woo] 퀴즈 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizSubmissionRepository submissionRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final FamilyRelationRepository familyRelationRepository;

    // ========== [woo] 퀴즈 출제 ==========

    @Transactional
    public QuizDTO.DetailResponse createQuiz(QuizDTO.CreateRequest request, CustomUserDTO userDTO) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        // [woo 03/25] 수업 분반으로 변경 (과목+학급)
        CourseSection courseSection = courseSectionRepository.findById(request.getCourseSectionId())
                .orElseThrow(() -> new IllegalArgumentException("수업 분반 정보를 찾을 수 없습니다."));

        if (!courseSection.getTeacher().getId().equals(teacher.getId())) {
            throw new SecurityException("본인이 담당하는 수업 분반에만 퀴즈를 출제할 수 있습니다.");
        }

        Quiz quiz = Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .week(request.getWeek())
                .teacher(teacher)
                .classroom(courseSection.getClassroom())
                .dueDate(request.getDueDate())
                .maxAttempts(request.getMaxAttempts())
                // [soojin] 수정하는 이유: 출제 시 제한시간 저장값 반영
                .timeLimit(request.getTimeLimit())
                .showAnswer(request.getShowAnswer() != null ? request.getShowAnswer() : true)
                .build();

        // [woo] 문제 추가
        if (request.getQuestions() != null) {
            for (QuizDTO.QuestionRequest qReq : request.getQuestions()) {
                QuizQuestion question = QuizQuestion.builder()
                        .quiz(quiz)
                        .questionText(qReq.getQuestionText())
                        .questionOrder(qReq.getQuestionOrder())
                        .points(qReq.getPoints() > 0 ? qReq.getPoints() : 1)
                        .questionType(qReq.getQuestionType())
                        .correctAnswer(qReq.getCorrectAnswer())
                        .explanation(qReq.getExplanation())
                        .build();

                // [woo] 객관식 선택지 추가
                if (qReq.getQuestionType() == QuestionType.MULTIPLE_CHOICE && qReq.getOptions() != null) {
                    for (QuizDTO.OptionRequest oReq : qReq.getOptions()) {
                        QuizOption option = QuizOption.builder()
                                .question(question)
                                .optionText(oReq.getOptionText())
                                .optionOrder(oReq.getOptionOrder())
                                .isCorrect(Boolean.TRUE.equals(oReq.getIsCorrect()))
                                .build();
                        question.getOptions().add(option);
                    }
                }

                quiz.getQuestions().add(question);
            }
        }

        Quiz saved = quizRepository.save(quiz);
        log.info("[woo] 퀴즈 출제: {} - {} (분반: {})", saved.getId(), saved.getTitle(), courseSection.getDisplayName());

        QuizDTO.DetailResponse response = QuizDTO.DetailResponse.fromEntity(saved);
        response.setQuestions(saved.getQuestions().stream()
                .map(q -> QuizDTO.QuestionResponse.fromEntity(q, true))
                .toList());
        return response;
    }

    // ========== [woo] 퀴즈 목록 ==========

    public Page<QuizDTO.ListResponse> getTeacherQuizzes(CustomUserDTO userDTO, Pageable pageable) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        return quizRepository.findByTeacherInfoId(teacher.getId(), pageable)
                .map(quiz -> {
                    QuizDTO.ListResponse response = QuizDTO.ListResponse.fromEntity(quiz);
                    // [soojin] 수정하는 이유: 교사용 카드 목록에서 응시 통계 표시를 위해 계산값 주입
                    int submissionCount = submissionRepository.countDistinctStudentByQuizId(quiz.getId());
                    int totalStudentCount = (int) studentInfoRepository.countByClassroomCid(quiz.getClassroom().getCid());
                    double averageScore = submissionRepository.findAverageScorePercentByQuizId(quiz.getId()).orElse(0.0);

                    response.setSubmissionCount(submissionCount);
                    response.setTotalStudentCount(totalStudentCount);
                    response.setAverageScore(Math.round(averageScore * 10.0) / 10.0);
                    return response;
                });
    }

    public Page<QuizDTO.ListResponse> getStudentQuizzes(CustomUserDTO userDTO, Pageable pageable) {
        StudentInfo student = studentInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        if (student.getCurrentAssignment() == null || student.getCurrentAssignment().getClassroom() == null) {
            throw new IllegalArgumentException("학급 배정 정보가 없습니다.");
        }

        Long classroomId = student.getCurrentAssignment().getClassroom().getCid();

        return quizRepository.findByClassroomCidAndIsDeletedFalseOrderByCreateDateDesc(classroomId, pageable)
                .map(quiz -> {
                    QuizDTO.ListResponse resp = QuizDTO.ListResponse.fromEntity(quiz);
                    // [woo] 학생 응시 정보 추가
                    int attempts = submissionRepository.countByQuizIdAndStudentId(quiz.getId(), student.getId());
                    resp.setMyAttemptCount(attempts);
                    submissionRepository.findBestScore(quiz.getId(), student.getId())
                            .ifPresent(resp::setMyBestScore);
                    return resp;
                });
    }

    // ========== [woo] 학부모: 자녀 퀴즈 목록 ==========

    public List<QuizDTO.ListResponse> getChildQuizzes(CustomUserDTO userDTO, Long childUserUid) {
        // [woo] 프론트에서 Child.id = user.getUid() 로 전달 → UserUid로 StudentInfo 먼저 조회
        StudentInfo child = studentInfoRepository.findByUserUid(childUserUid)
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        // [woo] 학부모-자녀 관계 확인
        List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(userDTO.getUid());
        boolean isMyChild = relations.stream()
                .anyMatch(r -> r.getStudentInfo().getId().equals(child.getId()));

        if (!isMyChild) {
            throw new SecurityException("본인 자녀의 정보만 조회할 수 있습니다.");
        }

        if (child.getCurrentAssignment() == null || child.getCurrentAssignment().getClassroom() == null) {
            throw new IllegalArgumentException("자녀의 학급 배정 정보가 없습니다.");
        }

        Long classroomId = child.getCurrentAssignment().getClassroom().getCid();
        List<Quiz> quizzes = quizRepository.findAllByClassroomId(classroomId);

        return quizzes.stream().map(quiz -> {
            QuizDTO.ListResponse resp = QuizDTO.ListResponse.fromEntity(quiz);
            // [woo] 자녀 응시 정보 추가
            int attempts = submissionRepository.countByQuizIdAndStudentId(quiz.getId(), child.getId());
            resp.setMyAttemptCount(attempts);
            submissionRepository.findBestScore(quiz.getId(), child.getId())
                    .ifPresent(resp::setMyBestScore);
            return resp;
        }).collect(Collectors.toList());
    }

    // ========== [woo] 퀴즈 상세 ==========

    public QuizDTO.DetailResponse getQuiz(Long quizId, CustomUserDTO userDTO) {
        Quiz quiz = findQuizOrThrow(quizId);
        QuizDTO.DetailResponse response = QuizDTO.DetailResponse.fromEntity(quiz);

        boolean isTeacherOrAdmin = isTeacher(userDTO) || isAdmin(userDTO);

        // [woo] 문제 목록 (교사: 정답 포함 / 학생: 정답 제외)
        response.setQuestions(quiz.getQuestions().stream()
                .map(q -> QuizDTO.QuestionResponse.fromEntity(q, isTeacherOrAdmin))
                .toList());

        // [woo] 교사: 전체 응시 현황
        if (isTeacherOrAdmin) {
            List<QuizSubmission> allSubs = submissionRepository.findByQuizIdOrderByStudentIdAscAttemptNumberDesc(quizId);
            response.setSubmissions(allSubs.stream()
                    .map(s -> QuizDTO.SubmissionResponse.fromEntity(s, false))
                    .toList());

            // [soojin] 학급 전체 학생(응시 + 미응시) 목록 생성
            List<StudentInfo> allStudentsInClass = studentInfoRepository.findByClassroomCid(quiz.getClassroom().getCid());
            Map<Long, QuizSubmission> latestByStudent = allSubs.stream()
                    .collect(Collectors.toMap(
                            s -> s.getStudent().getId(),
                            s -> s,
                            (a, b) -> a.getAttemptNumber() >= b.getAttemptNumber() ? a : b
                    ));
            List<QuizDTO.StudentWithSubmissionResponse> allStudentList = allStudentsInClass.stream()
                    .map(si -> {
                        QuizSubmission sub = latestByStudent.get(si.getId());
                        return QuizDTO.StudentWithSubmissionResponse.builder()
                                .studentInfoId(si.getId())
                                .studentName(si.getUser().getName())
                                .studentNumber(si.getFullStudentNumber())
                                .submitted(sub != null)
                                .latestSubmission(sub != null ? QuizDTO.SubmissionResponse.fromEntity(sub, false) : null)
                                .build();
                    }).toList();
            response.setAllStudents(allStudentList);
        }

        // [woo] 학생: 본인 응시 결과
        if (isStudent(userDTO)) {
            StudentInfo student = studentInfoRepository.findByUserUid(userDTO.getUid()).orElse(null);
            if (student != null) {
                List<QuizSubmission> mySubs = submissionRepository
                        .findByQuizIdAndStudentIdOrderByAttemptNumberDesc(quizId, student.getId());
                response.setMySubmissions(mySubs.stream()
                        .map(s -> QuizDTO.SubmissionResponse.fromEntity(s, quiz.isShowAnswer()))
                        .toList());
            }
        }

        return response;
    }

    // ========== [woo] 퀴즈 제출 (자동 채점) ==========

    @Transactional
    public QuizDTO.SubmissionResponse submitQuiz(Long quizId, QuizDTO.SubmitRequest request, CustomUserDTO userDTO) {
        Quiz quiz = findQuizOrThrow(quizId);

        if (quiz.getStatus() == Quiz.QuizStatus.CLOSED) {
            throw new IllegalArgumentException("마감된 퀴즈입니다.");
        }

        StudentInfo student = studentInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        // [woo] 응시 횟수 확인
        int currentAttempts = submissionRepository.countByQuizIdAndStudentId(quizId, student.getId());
        if (quiz.getMaxAttempts() != null && currentAttempts >= quiz.getMaxAttempts()) {
            throw new IllegalArgumentException("최대 응시 횟수(" + quiz.getMaxAttempts() + "회)를 초과했습니다.");
        }

        // [woo] 문제를 ID로 매핑
        Map<Long, QuizQuestion> questionMap = quiz.getQuestions().stream()
                .collect(Collectors.toMap(QuizQuestion::getId, Function.identity()));

        QuizSubmission submission = QuizSubmission.builder()
                .quiz(quiz)
                .student(student)
                .attemptNumber(currentAttempts + 1)
                .submittedAt(LocalDateTime.now())
                .score(0)
                .totalPoints(quiz.getTotalPoints())
                .build();

        int totalScore = 0;

        // [woo] 각 답안 채점
        for (QuizDTO.AnswerRequest aReq : request.getAnswers()) {
            QuizQuestion question = questionMap.get(aReq.getQuestionId());
            if (question == null) continue;

            boolean correct = false;
            int earned = 0;

            if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
                // [woo] 객관식: 선택한 옵션이 정답인지 확인
                if (aReq.getSelectedOptionId() != null) {
                    correct = question.getOptions().stream()
                            .anyMatch(o -> o.getId().equals(aReq.getSelectedOptionId()) && o.isCorrect());
                }
            } else {
                // [woo] 단답형: 정답 비교 (공백 제거, 대소문자 무시)
                correct = question.checkShortAnswer(aReq.getAnswerText());
            }

            if (correct) {
                earned = question.getPoints();
                totalScore += earned;
            }

            QuizOption selectedOption = null;
            if (aReq.getSelectedOptionId() != null) {
                selectedOption = question.getOptions().stream()
                        .filter(o -> o.getId().equals(aReq.getSelectedOptionId()))
                        .findFirst().orElse(null);
            }

            QuizAnswer answer = QuizAnswer.builder()
                    .submission(submission)
                    .question(question)
                    .selectedOption(selectedOption)
                    .answerText(aReq.getAnswerText())
                    .isCorrect(correct)
                    .earnedPoints(earned)
                    .build();

            submission.getAnswers().add(answer);
        }

        submission.setScore(totalScore);
        QuizSubmission saved = submissionRepository.save(submission);

        log.info("[woo] 퀴즈 제출: 퀴즈={}, 학생={}, 점수={}/{}",
                quizId, student.getUser().getName(), totalScore, quiz.getTotalPoints());

        return QuizDTO.SubmissionResponse.fromEntity(saved, quiz.isShowAnswer());
    }

    // ========== [woo] 퀴즈 수정 (트랜잭션 1: 문제/선택지 업데이트) ==========

    @Transactional
    public void updateQuiz(Long quizId, QuizDTO.CreateRequest request, CustomUserDTO userDTO) {
        Quiz quiz = findQuizOrThrow(quizId);
        validateTeacherOwner(quiz, userDTO);

        // [woo] 기본 정보 수정
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setWeek(request.getWeek());
        quiz.setDueDate(request.getDueDate());
        quiz.setMaxAttempts(request.getMaxAttempts());
        // [soojin] 수정하는 이유: 수정 요청에서도 제한시간 변경 가능하도록 동기화
        quiz.setTimeLimit(request.getTimeLimit());
        if (request.getShowAnswer() != null) {
            quiz.setShowAnswer(request.getShowAnswer());
        }

        // [woo 03/25] 수업 분반 변경 시 학급도 변경
        if (request.getCourseSectionId() != null) {
            CourseSection courseSection = courseSectionRepository.findById(request.getCourseSectionId())
                    .orElseThrow(() -> new IllegalArgumentException("수업 분반 정보를 찾을 수 없습니다."));
            quiz.setClassroom(courseSection.getClassroom());
        }

        // [woo] 문제 수정 (in-place 업데이트 → 기존 응시 기록의 FK 유지)
        if (request.getQuestions() != null) {
            List<QuizQuestion> existing = new ArrayList<>(quiz.getQuestions());
            existing.sort(java.util.Comparator.comparingInt(QuizQuestion::getQuestionOrder));
            List<QuizDTO.QuestionRequest> requested = request.getQuestions();

            int minQ = Math.min(existing.size(), requested.size());

            // [woo] 기존 문제 in-place 업데이트
            for (int i = 0; i < minQ; i++) {
                QuizQuestion eq = existing.get(i);
                QuizDTO.QuestionRequest rq = requested.get(i);

                eq.setQuestionText(rq.getQuestionText());
                eq.setQuestionOrder(rq.getQuestionOrder());
                eq.setPoints(rq.getPoints() > 0 ? rq.getPoints() : 1);
                eq.setQuestionType(rq.getQuestionType());
                eq.setCorrectAnswer(rq.getCorrectAnswer());
                eq.setExplanation(rq.getExplanation());

                // [woo] 객관식 선택지 in-place 업데이트
                if (rq.getQuestionType() == QuestionType.MULTIPLE_CHOICE && rq.getOptions() != null) {
                    List<QuizOption> existOpts = new ArrayList<>(eq.getOptions());
                    existOpts.sort(java.util.Comparator.comparingInt(QuizOption::getOptionOrder));
                    List<QuizDTO.OptionRequest> reqOpts = rq.getOptions();
                    int minO = Math.min(existOpts.size(), reqOpts.size());

                    for (int j = 0; j < minO; j++) {
                        QuizOption eo = existOpts.get(j);
                        QuizDTO.OptionRequest ro = reqOpts.get(j);
                        eo.setOptionText(ro.getOptionText());
                        eo.setOptionOrder(ro.getOptionOrder());
                        eo.setCorrect(Boolean.TRUE.equals(ro.getIsCorrect()));
                    }
                    // [woo] 새 선택지 추가
                    for (int j = minO; j < reqOpts.size(); j++) {
                        QuizDTO.OptionRequest ro = reqOpts.get(j);
                        QuizOption newOpt = QuizOption.builder()
                                .question(eq)
                                .optionText(ro.getOptionText())
                                .optionOrder(ro.getOptionOrder())
                                .isCorrect(Boolean.TRUE.equals(ro.getIsCorrect()))
                                .build();
                        eq.getOptions().add(newOpt);
                    }
                    // [woo] 초과 선택지 삭제
                    for (int j = existOpts.size() - 1; j >= reqOpts.size(); j--) {
                        eq.getOptions().remove(existOpts.get(j));
                    }
                } else {
                    // [woo] 단답형으로 변경된 경우 선택지 제거
                    eq.getOptions().clear();
                }
            }

            // [woo] 새 문제 추가
            for (int i = minQ; i < requested.size(); i++) {
                QuizDTO.QuestionRequest rq = requested.get(i);
                QuizQuestion newQ = QuizQuestion.builder()
                        .quiz(quiz)
                        .questionText(rq.getQuestionText())
                        .questionOrder(rq.getQuestionOrder())
                        .points(rq.getPoints() > 0 ? rq.getPoints() : 1)
                        .questionType(rq.getQuestionType())
                        .correctAnswer(rq.getCorrectAnswer())
                        .explanation(rq.getExplanation())
                        .build();

                if (rq.getQuestionType() == QuestionType.MULTIPLE_CHOICE && rq.getOptions() != null) {
                    for (QuizDTO.OptionRequest oReq : rq.getOptions()) {
                        QuizOption opt = QuizOption.builder()
                                .question(newQ)
                                .optionText(oReq.getOptionText())
                                .optionOrder(oReq.getOptionOrder())
                                .isCorrect(Boolean.TRUE.equals(oReq.getIsCorrect()))
                                .build();
                        newQ.getOptions().add(opt);
                    }
                }
                quiz.getQuestions().add(newQ);
            }

            // [woo] 초과 문제 삭제
            for (int i = existing.size() - 1; i >= requested.size(); i--) {
                quiz.getQuestions().remove(existing.get(i));
            }
        }

        log.info("[woo] 퀴즈 수정: {} - {}", quizId, request.getTitle());
    }

    // ========== [woo] 퀴즈 재채점 (트랜잭션 2: 별도 세션에서 실행) ==========

    @Transactional
    public QuizDTO.DetailResponse regradeAndGetQuiz(Long quizId) {
        // [woo] 새 트랜잭션/세션에서 submission 로드 → 재채점
        regradeSubmissions(quizId);

        // [woo] 최종 응답 생성
        Quiz saved = quizRepository.findById(quizId).orElseThrow();
        QuizDTO.DetailResponse response = QuizDTO.DetailResponse.fromEntity(saved);
        response.setQuestions(saved.getQuestions().stream()
                .map(q -> QuizDTO.QuestionResponse.fromEntity(q, true))
                .toList());
        return response;
    }

    // ========== [woo] 퀴즈 삭제 ==========

    @Transactional
    public void deleteQuiz(Long quizId, CustomUserDTO userDTO) {
        Quiz quiz = findQuizOrThrow(quizId);
        validateTeacherOwner(quiz, userDTO);
        quiz.delete();
        log.info("[woo] 퀴즈 삭제: {} by {}", quizId, userDTO.getName());
    }

    // ========== [woo] 퀴즈 상태 변경 ==========

    @Transactional
    public void changeQuizStatus(Long quizId, Quiz.QuizStatus status, CustomUserDTO userDTO) {
        Quiz quiz = findQuizOrThrow(quizId);
        validateTeacherOwner(quiz, userDTO);
        quiz.setStatus(status);
        log.info("[woo] 퀴즈 상태 변경: {} → {} by {}", quizId, status, userDTO.getName());
    }

    // ========== [woo] 재채점 ==========

    /**
     * [woo] 퀴즈 문제/정답 수정 후 기존 응시 기록 재채점
     * - flush/clear 후 호출하여 깨끗한 세션에서 submission을 로드
     * - 객관식: 선택한 옵션의 isCorrect 값 기준
     * - 단답형: 수정된 correctAnswer 기준으로 재비교
     */
    private void regradeSubmissions(Long quizId) {
        List<QuizSubmission> submissions = submissionRepository
                .findByQuizIdOrderByStudentIdAscAttemptNumberDesc(quizId);
        if (submissions.isEmpty()) return;

        // [woo] 수정된 퀴즈의 총 배점
        Quiz quiz = quizRepository.findById(quizId).orElse(null);
        if (quiz == null) return;
        int totalPoints = quiz.getTotalPoints();

        int regraded = 0;
        for (QuizSubmission submission : submissions) {
            int newScore = 0;
            for (QuizAnswer answer : submission.getAnswers()) {
                QuizQuestion question = answer.getQuestion();
                boolean correct = false;
                int earned = 0;

                if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
                    // [woo] 객관식: 선택한 옵션이 (수정된) 정답인지 확인
                    if (answer.getSelectedOption() != null) {
                        correct = answer.getSelectedOption().isCorrect();
                    }
                } else {
                    // [woo] 단답형: (수정된) correctAnswer 기준으로 재비교
                    correct = question.checkShortAnswer(answer.getAnswerText());
                }

                if (correct) {
                    earned = question.getPoints();
                    newScore += earned;
                }

                answer.setCorrect(correct);
                answer.setEarnedPoints(earned);
            }
            submission.setScore(newScore);
            submission.setTotalPoints(totalPoints);
            regraded++;
        }

        submissionRepository.saveAll(submissions);
        log.info("[woo] 퀴즈 {} 재채점 완료: {}건", quizId, regraded);
    }

    // ========== 헬퍼 ==========

    private Quiz findQuizOrThrow(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("퀴즈를 찾을 수 없습니다: " + quizId));
        if (quiz.isDeleted()) {
            throw new IllegalArgumentException("삭제된 퀴즈입니다.");
        }
        return quiz;
    }

    private void validateTeacherOwner(Quiz quiz, CustomUserDTO userDTO) {
        if (isAdmin(userDTO)) return;
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new SecurityException("교사 정보를 찾을 수 없습니다."));
        if (!quiz.getTeacher().getId().equals(teacher.getId())) {
            throw new SecurityException("본인이 출제한 퀴즈만 수정/삭제할 수 있습니다.");
        }
    }

    private boolean isTeacher(CustomUserDTO u) {
        return u.hasRole(UserRole.TEACHER) || UserRole.TEACHER.equals(u.getRole());
    }

    private boolean isStudent(CustomUserDTO u) {
        return u.hasRole(UserRole.STUDENT) || UserRole.STUDENT.equals(u.getRole());
    }

    private boolean isAdmin(CustomUserDTO u) {
        return u.hasRole(UserRole.ADMIN) || UserRole.ADMIN.equals(u.getRole());
    }
}
