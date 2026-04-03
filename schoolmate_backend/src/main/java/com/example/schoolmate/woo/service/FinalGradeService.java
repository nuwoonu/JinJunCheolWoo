package com.example.schoolmate.woo.service;

import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.GradeRepository;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.TestType;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.homework.entity.HomeworkSubmission;
import com.example.schoolmate.homework.repository.HomeworkSubmissionRepository;
import com.example.schoolmate.quiz.entity.QuizSubmission;
import com.example.schoolmate.quiz.repository.QuizSubmissionRepository;
import com.example.schoolmate.woo.dto.FinalGradeResponseDTO;
import com.example.schoolmate.woo.entity.FinalGrade;
import com.example.schoolmate.woo.entity.GradeRatio;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;
import com.example.schoolmate.woo.repository.FinalGradeRepository;
import com.example.schoolmate.woo.repository.GradeRatioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

// [woo] 최종 성적 계산 및 조회 서비스
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinalGradeService {

    private final FinalGradeRepository finalGradeRepository;
    private final GradeRatioRepository gradeRatioRepository;
    private final GradeRepository gradeRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final ClassroomRepository classroomRepository;
    private final SubjectRepository subjectRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;
    private final AcademicTermRepository academicTermRepository;

    // [woo] FinalGrade 계산 (수동 트리거)
    @Transactional
    public List<FinalGradeResponseDTO> calculateFinalGrades(
            Long classroomId, Long subjectId, Semester semester, int schoolYear) {

        GradeRatio ratio = gradeRatioRepository
                .findByClassroomCidAndSubjectIdAndSemesterAndSchoolYear(
                        classroomId, subjectId, semester, schoolYear)
                .orElseThrow(() -> new IllegalStateException(
                        "비율 설정이 없습니다. 먼저 비율을 설정해 주세요."));

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다."));

        Long schoolId = classroom.getSchool().getId();
        int semesterNum = semester.ordinal() + 1;
        AcademicTerm academicTerm = academicTermRepository
                .findBySchoolIdAndSchoolYearAndSemester(schoolId, schoolYear, semesterNum)
                .orElseThrow(() -> new IllegalStateException("해당 학기 정보를 찾을 수 없습니다."));
        Long termId = academicTerm.getId();

        List<StudentInfo> students = studentInfoRepository.findByCurrentClassroomId(classroomId);

        return students.stream().map(student -> {
            Double midtermScore = calcExamScore(student.getId(), subjectId, termId, TestType.MIDTERMTEST);
            Double finalExamScore = calcExamScore(student.getId(), subjectId, termId, TestType.FINALTEST);
            Double homeworkScore = calcHomeworkScore(student.getId(), classroomId, subjectId);
            Double quizScore = calcQuizScore(student.getId(), classroomId);

            Double totalScore = calcTotalScore(midtermScore, finalExamScore, homeworkScore, quizScore, ratio);

            FinalGrade fg = finalGradeRepository
                    .findByStudentIdAndClassroomCidAndSubjectIdAndSemesterAndSchoolYear(
                            student.getId(), classroomId, subjectId, semester, schoolYear)
                    .orElseGet(() -> FinalGrade.builder()
                            .student(student)
                            .classroom(classroom)
                            .subject(subject)
                            .semester(semester)
                            .schoolYear(schoolYear)
                            .calculatedAt(LocalDateTime.now())
                            .build());

            fg.setMidtermScore(midtermScore);
            fg.setFinalExamScore(finalExamScore);
            fg.setHomeworkScore(homeworkScore);
            fg.setQuizScore(quizScore);
            fg.setTotalScore(totalScore);
            fg.setGradeRatio(ratio);
            fg.setCalculatedAt(LocalDateTime.now());

            FinalGrade saved = finalGradeRepository.save(fg);
            return toResponseDTO(saved, ratio);
        }).collect(Collectors.toList());
    }

    // [woo] 학생 FinalGrade 조회
    public List<FinalGradeResponseDTO> getStudentFinalGrades(
            Long studentId, Semester semester, int schoolYear) {
        List<FinalGrade> list = (semester != null)
                ? finalGradeRepository.findByStudentIdAndSemesterAndSchoolYear(studentId, semester, schoolYear)
                : finalGradeRepository.findByStudentId(studentId);
        return list.stream()
                .map(fg -> toResponseDTO(fg, fg.getGradeRatio()))
                .collect(Collectors.toList());
    }

    // [woo] 학급+과목 FinalGrade 목록 (교사 조회)
    public List<FinalGradeResponseDTO> getClassFinalGrades(
            Long classroomId, Long subjectId, Semester semester, int schoolYear) {
        return finalGradeRepository
                .findByClassroomAndSubjectAndSemesterAndSchoolYear(classroomId, subjectId, semester, schoolYear)
                .stream()
                .map(fg -> toResponseDTO(fg, fg.getGradeRatio()))
                .collect(Collectors.toList());
    }

    // --- 점수 계산 내부 메서드 ---

    // [woo] 시험 점수: 해당 testType의 Grade → 점수 (없으면 null)
    private Double calcExamScore(Long studentId, Long subjectId, Long termId, TestType testType) {
        List<Grade> grades = gradeRepository.findByStudentAndSubjectAndTermAndTestType(
                studentId, subjectId, termId, testType);
        if (grades.isEmpty()) return null;
        return grades.stream().mapToDouble(Grade::getScore).average().orElse(0.0);
    }

    // 과제 점수: GRADED 제출 (score/maxScore*100) 평균
    private Double calcHomeworkScore(Long studentId, Long classroomId, Long subjectId) {
        List<HomeworkSubmission> submissions = homeworkSubmissionRepository
                .findGradedByStudentAndClassroomAndSubject(
                        studentId, classroomId, subjectId, HomeworkSubmission.SubmissionStatus.GRADED);
        if (submissions.isEmpty()) return null;
        return submissions.stream()
                .filter(s -> s.getScore() != null && s.getHomework().getMaxScore() != null
                          && s.getHomework().getMaxScore() > 0)
                .mapToDouble(s -> (double) s.getScore() / s.getHomework().getMaxScore() * 100.0)
                .average()
                .orElse(0.0);
    }

    // 퀴즈 점수: (score/totalPoints*100) 평균 (subject 구분 없이 학급 단위)
    private Double calcQuizScore(Long studentId, Long classroomId) {
        List<QuizSubmission> submissions = quizSubmissionRepository
                .findByStudentIdAndClassroomId(studentId, classroomId);
        if (submissions.isEmpty()) return null;
        return submissions.stream()
                .filter(s -> s.getTotalPoints() > 0)
                .mapToDouble(s -> (double) s.getScore() / s.getTotalPoints() * 100.0)
                .average()
                .orElse(0.0);
    }

    // 최종 점수: null 항목은 0점으로 처리
    private Double calcTotalScore(Double midterm, Double finalExam,
                                   Double homework, Double quiz, GradeRatio ratio) {
        double m = midterm != null ? midterm : 0.0;
        double f = finalExam != null ? finalExam : 0.0;
        double h = homework != null ? homework : 0.0;
        double q = quiz != null ? quiz : 0.0;

        return m * ratio.getMidtermRatio() / 100.0
             + f * ratio.getFinalRatio() / 100.0
             + h * ratio.getHomeworkRatio() / 100.0
             + q * ratio.getQuizRatio() / 100.0;
    }

    private FinalGradeResponseDTO toResponseDTO(FinalGrade fg, GradeRatio ratio) {
        return FinalGradeResponseDTO.builder()
                .id(fg.getId())
                .studentId(fg.getStudent().getId())
                .studentName(fg.getStudent().getUser().getName())
                .subjectId(fg.getSubject().getId())
                .subjectCode(fg.getSubject().getCode())
                .subjectName(fg.getSubject().getName())
                .semester(fg.getSemester())
                .schoolYear(fg.getSchoolYear())
                .midtermScore(fg.getMidtermScore())
                .finalExamScore(fg.getFinalExamScore())
                .homeworkScore(fg.getHomeworkScore())
                .quizScore(fg.getQuizScore())
                .totalScore(fg.getTotalScore())
                .midtermRatio(ratio != null ? ratio.getMidtermRatio() : null)
                .finalRatio(ratio != null ? ratio.getFinalRatio() : null)
                .homeworkRatio(ratio != null ? ratio.getHomeworkRatio() : null)
                .quizRatio(ratio != null ? ratio.getQuizRatio() : null)
                .calculatedAt(fg.getCalculatedAt())
                .build();
    }
}
