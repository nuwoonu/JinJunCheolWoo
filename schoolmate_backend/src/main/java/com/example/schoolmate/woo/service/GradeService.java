package com.example.schoolmate.woo.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.constant.TestType;
import com.example.schoolmate.common.repository.info.FamilyRelationRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.CourseSection;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.domain.term.repository.CourseSectionRepository;
import com.example.schoolmate.domain.term.service.AcademicTermService;
import com.example.schoolmate.homework.entity.Homework;
import com.example.schoolmate.homework.entity.HomeworkSubmission;
import com.example.schoolmate.homework.repository.HomeworkRepository;
import com.example.schoolmate.homework.repository.HomeworkSubmissionRepository;
import com.example.schoolmate.quiz.entity.Quiz;
import com.example.schoolmate.quiz.repository.QuizRepository;
import com.example.schoolmate.quiz.repository.QuizSubmissionRepository;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.GradeResponseDTO;
import com.example.schoolmate.woo.entity.Grade;
import com.example.schoolmate.woo.entity.SectionRatio;
import com.example.schoolmate.woo.repository.GradeRepository;
import com.example.schoolmate.woo.repository.SectionRatioRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// [woo] 성적 서비스
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeService {

    private final GradeRepository gradeRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final AcademicTermRepository academicTermRepository;
    private final AcademicTermService academicTermService;
    private final ClassroomRepository classroomRepository;
    private final SectionRatioRepository sectionRatioRepository;
    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final QuizRepository quizRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;

    // ========== [woo] 교사: 내 분반 목록 조회 ==========

    /**
     * 교사의 현재 학기 분반 목록 조회
     * termId가 null이면 현재 활성 학기 사용
     */
    public List<CourseSectionDTO> getMyCourseSections(Long uid, Long termId) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        // [woo] 교사의 학교 ID로 학기 조회 (SchoolContextHolder 미설정 환경 대응)
        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(teacher.getSchool().getId());

        // [woo] 본인 담당 분반
        List<CourseSection> ownSections = courseSectionRepository.findByTermAndTeacher(term, teacher);
        java.util.Set<Long> ownSectionIds = ownSections.stream()
                .map(CourseSection::getId).collect(Collectors.toSet());

        List<CourseSectionDTO> result = new java.util.ArrayList<>();
        ownSections.forEach(cs -> result.add(toCourseSectionDTO(cs, term, false)));

        // [woo] 담임 학급의 분반: 담임교사는 본인이 가르치지 않는 과목도 열람 가능 (입력은 불가)
        List<com.example.schoolmate.common.entity.Classroom> homeroomClassrooms =
                getHomeroomClassrooms(teacher, uid, term.getSchoolYear());
        for (com.example.schoolmate.common.entity.Classroom hc : homeroomClassrooms) {
            courseSectionRepository.findByTermAndClassroom(term, hc).stream()
                    .filter(cs -> !ownSectionIds.contains(cs.getId()))
                    .forEach(cs -> result.add(toCourseSectionDTO(cs, term, true)));
        }

        return result;
    }

    // ========== [woo] 교사: 분반별 성적 목록 조회 ==========

    public List<GradeResponseDTO> getSectionGrades(Long courseSectionId, TestType testType, Long uid) {
        CourseSection section = courseSectionRepository.findById(courseSectionId)
                .orElseThrow(() -> new IllegalArgumentException("분반 정보를 찾을 수 없습니다."));

        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        // [woo] 본인 담당 분반 또는 담임 학급 분반만 조회 가능
        if (!section.getTeacher().getId().equals(teacher.getId())
                && !isHomeroomTeacher(section.getClassroom(), teacher, uid)) {
            throw new SecurityException("본인이 담당하는 분반만 조회할 수 있습니다.");
        }

        List<Grade> grades = gradeRepository.findBySectionAndTestType(
                section.getClassroom().getCid(),
                section.getSubject().getId(),
                section.getTerm().getId(),
                testType);

        return grades.stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    // ========== [woo] 교사: 분반 학생 목록 조회 (성적 미입력 학생 포함) ==========

    public List<GradeResponseDTO> getSectionStudents(Long courseSectionId, TestType testType, Long uid) {
        CourseSection section = courseSectionRepository.findById(courseSectionId)
                .orElseThrow(() -> new IllegalArgumentException("분반 정보를 찾을 수 없습니다."));

        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        // [woo] 본인 담당 분반 또는 담임 학급 분반 조회 가능 (담임은 열람만, 입력은 inputGrade에서 별도 차단)
        if (!section.getTeacher().getId().equals(teacher.getId())
                && !isHomeroomTeacher(section.getClassroom(), teacher, uid)) {
            throw new SecurityException("본인이 담당하는 분반만 조회할 수 있습니다.");
        }

        // [woo] 해당 학년도 학급 학생 전원 조회, 없으면 학년도 무관으로 폴백
        int schoolYear = section.getTerm().getSchoolYear();
        List<StudentInfo> students = studentInfoRepository.findByClassroomIdAndSchoolYear(
                section.getClassroom().getCid(), schoolYear);
        if (students.isEmpty()) {
            students = studentInfoRepository.findByClassroomId(section.getClassroom().getCid());
        }

        // [woo] 기존 성적 조회
        List<Grade> existingGrades = gradeRepository.findBySectionAndTestType(
                section.getClassroom().getCid(),
                section.getSubject().getId(),
                section.getTerm().getId(),
                testType);

        // [woo] QUIZ/HOMEWORK 탭: 제출 데이터에서 자동 계산
        java.util.Map<Long, Double> autoScores = java.util.Collections.emptyMap();
        if (testType == TestType.HOMEWORK) {
            // [woo] 분반의 채점 완료 과제 제출 → 학생별 평균 (0~100 환산)
            List<HomeworkSubmission> submissions = homeworkSubmissionRepository.findGradedBySectionId(section.getId());
            autoScores = new java.util.HashMap<>();
            java.util.Map<Long, List<Double>> scoreMap = new java.util.HashMap<>();
            for (HomeworkSubmission sub : submissions) {
                if (sub.getScore() == null) continue;
                Long sid = sub.getStudent().getId();
                int maxScore = sub.getHomework().getMaxScore() != null ? sub.getHomework().getMaxScore() : 100;
                double normalized = maxScore > 0 ? (sub.getScore() * 100.0 / maxScore) : 0;
                scoreMap.computeIfAbsent(sid, k -> new java.util.ArrayList<>()).add(normalized);
            }
            for (var entry : scoreMap.entrySet()) {
                double avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
                autoScores.put(entry.getKey(), Math.round(avg * 10.0) / 10.0);
            }
        } else if (testType == TestType.QUIZ) {
            // [woo] 분반 기준 우선, courseSection 미설정 구버전은 교사+학급 폴백
            List<Quiz> quizzes = quizRepository.findByCourseSection(section.getId());
            if (quizzes.isEmpty()) {
                quizzes = quizRepository.findByTeacherAndClassroom(
                        section.getTeacher().getId(), section.getClassroom().getCid());
            }
            autoScores = new java.util.HashMap<>();
            java.util.Map<Long, List<Double>> scoreMap = new java.util.HashMap<>();
            for (Quiz quiz : quizzes) {
                int totalPoints = quiz.getTotalPoints();
                if (totalPoints == 0) continue;
                for (StudentInfo student : students) {
                    quizSubmissionRepository.findBestScore(quiz.getId(), student.getId())
                            .ifPresent(best -> {
                                double normalized = best * 100.0 / totalPoints;
                                scoreMap.computeIfAbsent(student.getId(), k -> new java.util.ArrayList<>()).add(normalized);
                            });
                }
            }
            java.util.Map<Long, Double> finalAutoScores = new java.util.HashMap<>();
            for (var entry : scoreMap.entrySet()) {
                double avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
                finalAutoScores.put(entry.getKey(), Math.round(avg * 10.0) / 10.0);
            }
            autoScores = finalAutoScores;
        }

        // [woo] 학생별로 Grade 있으면 사용, 없으면 자동 계산값 사용
        final java.util.Map<Long, Double> finalAutoScores = autoScores;
        return students.stream().map(student -> {
            StudentAssignment assignment = student.getAssignments().stream()
                    .filter(a -> a.getSchoolYear() == schoolYear)
                    .findFirst().orElse(null);
            Grade grade = existingGrades.stream()
                    .filter(g -> g.getStudent().getId().equals(student.getId()))
                    .findFirst().orElse(null);

            // [woo] Grade가 없으면 자동 계산 점수로 채워줌
            Double score = grade != null ? grade.getScore() : finalAutoScores.get(student.getId());

            return GradeResponseDTO.builder()
                    .gradeId(grade != null ? grade.getId() : null)
                    .studentId(student.getId())
                    .studentName(student.getUser().getName())
                    .attendanceNum(assignment != null ? assignment.getAttendanceNum() : null)
                    .subjectId(section.getSubject().getId())
                    .subjectName(section.getSubject().getName())
                    .testType(testType)
                    .score(score)
                    .schoolYear(section.getTerm().getSchoolYear())
                    .semester(section.getTerm().getSemester())
                    .build();
        }).collect(Collectors.toList());
    }

    // ========== [woo] 교사: 성적 입력 (upsert) ==========

    @Transactional
    public GradeResponseDTO inputGrade(GradeInputDTO dto, Long uid) {
        CourseSection section = courseSectionRepository.findById(dto.getCourseSectionId())
                .orElseThrow(() -> new IllegalArgumentException("분반 정보를 찾을 수 없습니다."));

        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        if (!section.getTeacher().getId().equals(teacher.getId())) {
            throw new SecurityException("본인이 담당하는 분반에만 성적을 입력할 수 있습니다.");
        }

        StudentInfo student = studentInfoRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        if (dto.getScore() < 0 || dto.getScore() > 100) {
            throw new IllegalArgumentException("점수는 0~100 사이여야 합니다.");
        }

        // [woo] upsert: 기존 성적이 있으면 수정, 없으면 새로 생성
        Grade grade = gradeRepository.findByStudentIdAndSubjectIdAndAcademicTermIdAndTestType(
                student.getId(), section.getSubject().getId(),
                section.getTerm().getId(), dto.getTestType())
                .orElse(null);

        if (grade != null) {
            grade.changeScore(dto.getScore());
        } else {
            grade = Grade.builder()
                    .student(student)
                    .subject(section.getSubject())
                    .academicTerm(section.getTerm())
                    .testType(dto.getTestType())
                    .score(dto.getScore())
                    .inputTeacher(teacher)
                    .build();
            grade.setSchool(section.getSchool());
        }

        Grade saved = gradeRepository.save(grade);
        return toResponseDTO(saved);
    }

    // ========== [woo] 교사: 성적 수정 ==========

    @Transactional
    public GradeResponseDTO updateGrade(Long gradeId, Double score, Long uid) {
        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new IllegalArgumentException("성적 정보를 찾을 수 없습니다."));

        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        if (!grade.getInputTeacher().getId().equals(teacher.getId())) {
            throw new SecurityException("본인이 입력한 성적만 수정할 수 있습니다.");
        }

        if (score < 0 || score > 100) {
            throw new IllegalArgumentException("점수는 0~100 사이여야 합니다.");
        }

        grade.changeScore(score);
        return toResponseDTO(grade);
    }

    // ========== [woo] 담임교사: 학급 전체 성적 조회 ==========

    public List<GradeResponseDTO> getClassroomGrades(Long classroomId, Long termId, Long uid) {
        com.example.schoolmate.common.entity.Classroom classroom =
                classroomRepository.findById(classroomId)
                        .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));
        // [woo] 담임교사(또는 부담임)만 학급 전체 성적 조회 가능
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        boolean isVice = classroom.getViceTeacher() != null
                && classroom.getViceTeacher().getId().equals(teacher.getId());
        if (!isHomeroomTeacher(classroom, teacher, uid) && !isVice) {
            throw new SecurityException("담임교사만 학급 전체 성적을 조회할 수 있습니다.");
        }
        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(classroom.getSchool().getId());

        // [woo] 해당 학년도 학급 학생 전원 + 입력된 성적 함께 조회, 없으면 폴백
        int schoolYear = term.getSchoolYear();
        List<StudentInfo> students = studentInfoRepository.findByClassroomIdAndSchoolYear(classroomId, schoolYear);
        if (students.isEmpty()) {
            students = studentInfoRepository.findByClassroomId(classroomId);
        }
        List<Grade> grades = gradeRepository.findByClassroomAndTerm(classroomId, term.getId());

        // [woo] 학생 전원 기준으로 성적 매핑 (미입력 학생도 포함)
        List<GradeResponseDTO> result = new java.util.ArrayList<>();
        for (StudentInfo student : students) {
            StudentAssignment assignment = student.getAssignments().stream()
                    .filter(a -> a.getSchoolYear() == schoolYear)
                    .findFirst().orElse(null);
            List<Grade> studentGrades = grades.stream()
                    .filter(g -> g.getStudent().getId().equals(student.getId()))
                    .collect(Collectors.toList());
            if (studentGrades.isEmpty()) {
                // [woo] 성적 미입력 학생 — score=null 로 포함
                result.add(GradeResponseDTO.builder()
                        .gradeId(null)
                        .studentId(student.getId())
                        .studentName(student.getUser().getName())
                        .attendanceNum(assignment != null ? assignment.getAttendanceNum() : null)
                        .subjectId(null)
                        .subjectName(null)
                        .testType(null)
                        .score(null)
                        .schoolYear(term.getSchoolYear())
                        .semester(term.getSemester())
                        .build());
            } else {
                for (Grade grade : studentGrades) {
                    result.add(toResponseDTO(grade));
                }
            }
        }
        return result;
    }

    // ========== [woo] 학생: 본인 성적 조회 ==========

    public List<GradeResponseDTO> getMyGrades(Long uid, Long termId) {
        // [woo] primary 우선, 없으면 첫 번째 학생 정보 사용
        StudentInfo student = studentInfoRepository.findByUserUidAndPrimaryTrue(uid)
                .or(() -> studentInfoRepository.findAllByUserUid(uid).stream().findFirst())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        // [woo] 학생의 학교 ID로 학기 조회
        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(student.getSchool().getId());

        List<Grade> grades = gradeRepository.findByStudentAndTerm(student.getId(), term.getId());
        List<GradeResponseDTO> result = grades.stream().map(this::toResponseDTO).collect(Collectors.toList());

        // [woo] Grade에 HOMEWORK 없으면 제출 데이터에서 과목별 평균 보완
        boolean hasHomework = grades.stream().anyMatch(g -> g.getTestType() == TestType.HOMEWORK);
        if (!hasHomework) {
            result.addAll(calcHomeworkGrades(student.getId(), term));
        }

        // [woo] Grade에 QUIZ 없으면 제출 데이터에서 학급별 평균 보완
        boolean hasQuiz = grades.stream().anyMatch(g -> g.getTestType() == TestType.QUIZ);
        if (!hasQuiz) {
            result.addAll(calcQuizGrades(student, term));
        }

        return result;
    }

    // [woo] 과제 제출 기반 성적 계산 (학생용)
    private List<GradeResponseDTO> calcHomeworkGrades(Long studentId, AcademicTerm term) {
        List<HomeworkSubmission> submissions = homeworkSubmissionRepository
                .findGradedByStudentAndTerm(studentId, term.getId());
        // [woo] 과목별로 그룹핑 후 평균
        java.util.Map<String, List<Double>> bySubject = new java.util.HashMap<>();
        for (HomeworkSubmission sub : submissions) {
            if (sub.getScore() == null) continue;
            String subjectName = sub.getHomework().getCourseSection().getSubject().getName();
            int maxScore = sub.getHomework().getMaxScore() != null ? sub.getHomework().getMaxScore() : 100;
            double normalized = maxScore > 0 ? sub.getScore() * 100.0 / maxScore : 0;
            bySubject.computeIfAbsent(subjectName, k -> new java.util.ArrayList<>()).add(normalized);
        }
        return bySubject.entrySet().stream().map(e -> {
            double avg = e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
            return GradeResponseDTO.builder()
                    .gradeId(null).studentId(studentId)
                    .subjectName(e.getKey()).testType(TestType.HOMEWORK)
                    .score(Math.round(avg * 10.0) / 10.0)
                    .schoolYear(term.getSchoolYear()).semester(term.getSemester())
                    .build();
        }).collect(Collectors.toList());
    }

    // [woo] 퀴즈 제출 기반 성적 계산 (학생용) — 학급 단위
    private List<GradeResponseDTO> calcQuizGrades(StudentInfo student, AcademicTerm term) {
        StudentAssignment assignment = student.getCurrentAssignment();
        if (assignment == null || assignment.getClassroom() == null) return java.util.Collections.emptyList();
        Long classroomId = assignment.getClassroom().getCid();

        List<com.example.schoolmate.quiz.entity.QuizSubmission> submissions =
                quizSubmissionRepository.findBestScoresByStudentAndClassroom(student.getId(), classroomId);
        if (submissions.isEmpty()) return java.util.Collections.emptyList();

        double avg = submissions.stream().mapToDouble(qs -> {
            int total = qs.getQuiz().getTotalPoints();
            return total > 0 ? qs.getScore() * 100.0 / total : 0;
        }).average().orElse(0);

        return java.util.List.of(GradeResponseDTO.builder()
                .gradeId(null).studentId(student.getId())
                .subjectName("퀴즈").testType(TestType.QUIZ)
                .score(Math.round(avg * 10.0) / 10.0)
                .schoolYear(term.getSchoolYear()).semester(term.getSemester())
                .build());
    }

    // ========== [woo] 학부모: 자녀 성적 조회 ==========

    public List<GradeResponseDTO> getChildGrades(Long parentUid, Long studentInfoId, Long termId) {
        // [woo] 학부모-자녀 관계 확인
        List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(parentUid);
        boolean isMyChild = relations.stream()
                .anyMatch(r -> r.getStudentInfo().getId().equals(studentInfoId));
        if (!isMyChild) {
            throw new SecurityException("본인의 자녀 성적만 조회할 수 있습니다.");
        }

        // [woo] 자녀의 학교 ID로 학기 조회
        StudentInfo child = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));
        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(child.getSchool().getId());

        List<Grade> grades = gradeRepository.findByStudentAndTerm(studentInfoId, term.getId());
        List<GradeResponseDTO> result = grades.stream().map(this::toResponseDTO).collect(Collectors.toList());

        // [woo] Grade에 없는 과제/퀴즈 점수를 제출 데이터에서 보완
        boolean hasHomework = grades.stream().anyMatch(g -> g.getTestType() == TestType.HOMEWORK);
        if (!hasHomework) result.addAll(calcHomeworkGrades(studentInfoId, term));

        boolean hasQuiz = grades.stream().anyMatch(g -> g.getTestType() == TestType.QUIZ);
        if (!hasQuiz) result.addAll(calcQuizGrades(child, term));

        return result;
    }

    // ========== [woo] 학급의 과목별 비율 전체 조회 (담임교사 조회 페이지용) ==========

    public List<SectionRatioDTO> getClassroomRatios(Long classroomId, Long termId, Long uid) {
        com.example.schoolmate.common.entity.Classroom classroom =
                classroomRepository.findById(classroomId)
                        .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));
        // [woo] 담임교사(또는 부담임)만 학급 과목별 비율 조회 가능
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        boolean isVice = classroom.getViceTeacher() != null
                && classroom.getViceTeacher().getId().equals(teacher.getId());
        if (!isHomeroomTeacher(classroom, teacher, uid) && !isVice) {
            throw new SecurityException("담임교사만 학급 비율을 조회할 수 있습니다.");
        }
        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(classroom.getSchool().getId());

        // [woo] 해당 학급+학기의 모든 분반 조회 후 비율 반환
        List<CourseSection> sections = courseSectionRepository.findByTermAndClassroom(term, classroom);
        return sections.stream().map(section -> {
            SectionRatio ratio = sectionRatioRepository.findBySection_Id(section.getId()).orElse(null);
            if (ratio != null) {
                return toRatioDTO(ratio);
            }
            // [woo] 비율 미설정 시 기본값 반환 (중간50 + 기말50)
            return SectionRatioDTO.builder()
                    .sectionId(section.getId())
                    .subjectId(section.getSubject().getId())
                    .subjectName(section.getSubject().getName())
                    .midtermRatio(50)
                    .finalRatio(50)
                    .quizRatio(0)
                    .homeworkRatio(0)
                    .build();
        }).collect(Collectors.toList());
    }

    // ========== [woo] 비율 설정 조회 ==========

    public SectionRatioDTO getSectionRatio(Long sectionId, Long uid) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("분반 정보를 찾을 수 없습니다."));
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        // [woo] 담당 교사 또는 담임교사만 비율 조회 가능
        if (!section.getTeacher().getId().equals(teacher.getId())
                && !isHomeroomTeacher(section.getClassroom(), teacher, uid)) {
            throw new SecurityException("담당 교사 또는 담임교사만 비율을 조회할 수 있습니다.");
        }
        return sectionRatioRepository.findBySection_Id(sectionId)
                .map(this::toRatioDTO)
                .orElseGet(() -> SectionRatioDTO.builder()
                        .sectionId(sectionId)
                        .midtermRatio(50)
                        .finalRatio(50)
                        .quizRatio(0)
                        .homeworkRatio(0)
                        .build());
    }

    // ========== [woo] 비율 설정 저장 ==========

    @Transactional
    public SectionRatioDTO setSectionRatio(Long sectionId, SectionRatioDTO dto, Long uid) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("분반 정보를 찾을 수 없습니다."));

        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        if (!section.getTeacher().getId().equals(teacher.getId())) {
            throw new SecurityException("본인이 담당하는 분반의 비율만 설정할 수 있습니다.");
        }

        int total = dto.getMidtermRatio() + dto.getFinalRatio() + dto.getQuizRatio() + dto.getHomeworkRatio();
        if (total != 100) {
            throw new IllegalArgumentException("비율의 합은 100이어야 합니다. (현재: " + total + ")");
        }

        SectionRatio ratio = sectionRatioRepository.findBySection_Id(sectionId)
                .orElseGet(() -> {
                    SectionRatio r = SectionRatio.builder()
                            .section(section)
                            .midtermRatio(dto.getMidtermRatio())
                            .finalRatio(dto.getFinalRatio())
                            .quizRatio(dto.getQuizRatio())
                            .homeworkRatio(dto.getHomeworkRatio())
                            .build();
                    r.setSchool(section.getSchool());
                    return r;
                });

        ratio.setMidtermRatio(dto.getMidtermRatio());
        ratio.setFinalRatio(dto.getFinalRatio());
        ratio.setQuizRatio(dto.getQuizRatio());
        ratio.setHomeworkRatio(dto.getHomeworkRatio());

        return toRatioDTO(sectionRatioRepository.save(ratio));
    }

    // ========== [woo] 학기 목록 조회 ==========

    // [woo] schoolId 직접 전달 — SchoolContextHolder 미설정 환경용
    public List<TermDTO> getTermHistory(Long schoolId) {
        return academicTermService.getTermHistory(schoolId).stream()
                .map(t -> TermDTO.builder()
                        .termId(t.getId())
                        .schoolYear(t.getSchoolYear())
                        .semester(t.getSemester())
                        .displayName(t.getDisplayName())
                        .active(t.getStatus() == com.example.schoolmate.domain.term.entity.AcademicTermStatus.ACTIVE)
                        .build())
                .collect(Collectors.toList());
    }

    // ========== [woo] 내부 유틸 ==========

    // [woo] uid로 학교 ID 조회 — 교사/학생/학부모 모두 대응
    public Long getSchoolIdByUid(Long uid) {
        return teacherInfoRepository.findByUserUid(uid)
                .map(t -> t.getSchool().getId())
                .or(() -> studentInfoRepository.findByUserUidAndPrimaryTrue(uid)
                        .map(s -> s.getSchool().getId()))
                .or(() -> familyRelationRepository.findByParentInfo_User_Uid(uid).stream()
                        .findFirst()
                        .map(r -> r.getStudentInfo().getSchool().getId()))
                .orElse(null);
    }

    private AcademicTerm findTermById(Long termId) {
        return academicTermRepository.findById(termId)
                .orElseThrow(() -> new IllegalArgumentException("학기 정보를 찾을 수 없습니다. id=" + termId));
    }

    private GradeResponseDTO toResponseDTO(Grade grade) {
        int schoolYear = grade.getAcademicTerm().getSchoolYear();
        StudentAssignment assignment = grade.getStudent().getAssignments().stream()
                .filter(a -> a.getSchoolYear() == schoolYear)
                .findFirst().orElse(null);
        return GradeResponseDTO.builder()
                .gradeId(grade.getId())
                .studentId(grade.getStudent().getId())
                .studentName(grade.getStudent().getUser().getName())
                .attendanceNum(assignment != null ? assignment.getAttendanceNum() : null)
                .subjectId(grade.getSubject().getId())
                .subjectName(grade.getSubject().getName())
                .testType(grade.getTestType())
                .score(grade.getScore())
                .schoolYear(grade.getAcademicTerm().getSchoolYear())
                .semester(grade.getAcademicTerm().getSemester())
                .build();
    }

    private SectionRatioDTO toRatioDTO(SectionRatio r) {
        return SectionRatioDTO.builder()
                .sectionId(r.getSection().getId())
                .subjectId(r.getSection().getSubject().getId())
                .subjectName(r.getSection().getSubject().getName())
                .midtermRatio(r.getMidtermRatio())
                .finalRatio(r.getFinalRatio())
                .quizRatio(r.getQuizRatio())
                .homeworkRatio(r.getHomeworkRatio())
                .build();
    }

    // ========== [woo] 교사: 분반 성적 요약 대시보드 ==========

    public SectionSummaryDTO getSectionSummary(Long sectionId, Long uid) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("분반 정보를 찾을 수 없습니다."));

        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        // [woo] 본인 담당 분반 또는 담임 학급 분반 조회 가능
        if (!section.getTeacher().getId().equals(teacher.getId())
                && !isHomeroomTeacher(section.getClassroom(), teacher, uid)) {
            throw new SecurityException("본인이 담당하는 분반 또는 담임 학급만 조회할 수 있습니다.");
        }

        int schoolYear = section.getTerm().getSchoolYear();
        Long classroomId = section.getClassroom().getCid();
        // [woo] Bug1 fix: QUIZ는 분반 담당 교사 기준으로 조회해야 함 (요청자가 담임일 수 있으므로)
        Long sectionTeacherId = section.getTeacher().getId();

        // [woo] 학생 목록 (학년도 일치 → 폴백)
        List<StudentInfo> students = studentInfoRepository.findByClassroomIdAndSchoolYear(classroomId, schoolYear);
        if (students.isEmpty()) {
            students = studentInfoRepository.findByClassroomId(classroomId);
        }

        // [woo] 중간/기말 Grade 조회
        List<Grade> midGrades = gradeRepository.findBySectionAndTestType(
                classroomId, section.getSubject().getId(), section.getTerm().getId(), TestType.MIDTERMTEST);
        List<Grade> finalGrades = gradeRepository.findBySectionAndTestType(
                classroomId, section.getSubject().getId(), section.getTerm().getId(), TestType.FINALTEST);

        // [woo] HOMEWORK 자동계산: 마감된 과제 기준
        // - 미제출 → 0점, GRADED → 점수 사용, SUBMITTED/LATE(미채점) → 계산 제외
        java.util.Map<Long, Double> homeworkScores = new java.util.HashMap<>();
        long ungradedCount = homeworkSubmissionRepository.countUngradedByPastDueSectionId(sectionId);
        {
            List<Homework> pastDueHomeworks = homeworkRepository.findPastDueBySectionId(sectionId);
            List<HomeworkSubmission> allSubmissions = homeworkSubmissionRepository.findAllByPastDueSectionId(sectionId);
            // [woo] homework별 제출 맵 (studentId → submission)
            java.util.Map<Long, java.util.Map<Long, HomeworkSubmission>> hwSubMap = new java.util.HashMap<>();
            for (HomeworkSubmission sub : allSubmissions) {
                hwSubMap.computeIfAbsent(sub.getHomework().getId(), k -> new java.util.HashMap<>())
                        .put(sub.getStudent().getId(), sub);
            }
            java.util.Map<Long, List<Double>> tmpMap = new java.util.HashMap<>();
            for (Homework hw : pastDueHomeworks) {
                int maxScore = hw.getMaxScore() != null ? hw.getMaxScore() : 100;
                java.util.Map<Long, HomeworkSubmission> subByStudent = hwSubMap.getOrDefault(hw.getId(), java.util.Collections.emptyMap());
                for (StudentInfo student : students) {
                    Long sid = student.getId();
                    HomeworkSubmission sub = subByStudent.get(sid);
                    if (sub == null) {
                        // [woo] 미제출 → 0점
                        tmpMap.computeIfAbsent(sid, k -> new java.util.ArrayList<>()).add(0.0);
                    } else if (sub.getStatus() == HomeworkSubmission.SubmissionStatus.GRADED && sub.getScore() != null) {
                        // [woo] 채점 완료 → 점수 사용
                        double normalized = maxScore > 0 ? sub.getScore() * 100.0 / maxScore : 0;
                        tmpMap.computeIfAbsent(sid, k -> new java.util.ArrayList<>()).add(normalized);
                    }
                    // [woo] SUBMITTED/LATE(미채점) → 계산 제외
                }
            }
            for (var e : tmpMap.entrySet()) {
                double avg = e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
                homeworkScores.put(e.getKey(), Math.round(avg * 10.0) / 10.0);
            }
        }

        // [woo] QUIZ 자동계산: 분반 기준 우선, courseSection 미설정 구버전은 교사+학급 폴백
        java.util.Map<Long, Double> quizScores = new java.util.HashMap<>();
        {
            List<Quiz> quizzes = quizRepository.findByCourseSection(sectionId);
            if (quizzes.isEmpty()) {
                quizzes = quizRepository.findByTeacherAndClassroom(sectionTeacherId, classroomId);
            }
            java.util.Map<Long, List<Double>> tmpMap = new java.util.HashMap<>();
            for (Quiz quiz : quizzes) {
                int totalPoints = quiz.getTotalPoints();
                if (totalPoints == 0) continue;
                for (StudentInfo student : students) {
                    quizSubmissionRepository.findBestScore(quiz.getId(), student.getId())
                            .ifPresent(best -> {
                                double normalized = best * 100.0 / totalPoints;
                                tmpMap.computeIfAbsent(student.getId(), k -> new java.util.ArrayList<>()).add(normalized);
                            });
                }
            }
            for (var e : tmpMap.entrySet()) {
                double avg = e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
                quizScores.put(e.getKey(), Math.round(avg * 10.0) / 10.0);
            }
        }

        // [woo] 비율 조회 — 설정 안 됐으면 finalScore 계산 자체를 하지 않음
        SectionRatio ratioEntity = sectionRatioRepository.findBySection_Id(sectionId).orElse(null);
        boolean ratioSet = ratioEntity != null;
        int midR = ratioSet ? ratioEntity.getMidtermRatio() : 0;
        int finR = ratioSet ? ratioEntity.getFinalRatio() : 0;
        int quizR = ratioSet ? ratioEntity.getQuizRatio() : 0;
        int hwR  = ratioSet ? ratioEntity.getHomeworkRatio() : 0;

        // [woo] 제출률 계산용: 분반 전체 과제 목록 + 학생별 제출 수
        List<Homework> allHomeworks = homeworkRepository.findBySectionId(sectionId);
        int totalHw = allHomeworks.size();
        java.util.Map<Long, Long> submissionCountMap = new java.util.HashMap<>();
        if (totalHw > 0) {
            List<Object[]> counts = homeworkSubmissionRepository.countByStudentForSection(sectionId);
            for (Object[] row : counts) {
                submissionCountMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }

        // [woo] 학생별 요약 데이터 구성
        List<StudentSummaryDTO> summaryList = new java.util.ArrayList<>();
        for (StudentInfo student : students) {
            Long sid = student.getId();
            StudentAssignment assignment = student.getAssignments().stream()
                    .filter(a -> a.getSchoolYear() == schoolYear)
                    .findFirst().orElse(null);

            Double midScore = midGrades.stream().filter(g -> g.getStudent().getId().equals(sid))
                    .findFirst().map(Grade::getScore).orElse(null);
            Double finScore = finalGrades.stream().filter(g -> g.getStudent().getId().equals(sid))
                    .findFirst().map(Grade::getScore).orElse(null);
            Double quizScore = quizScores.get(sid);
            Double hwScore = homeworkScores.get(sid);

            // [woo] 비율 미설정이면 finalScore=null (성적 표시 안 함)
            // [woo] Bug2 fix: 입력된 항목의 비율 합계로 비례환산 (프론트 calcFinal 동일 로직)
            Double finalScore = null;
            if (ratioSet) {
                double fs = 0;
                int usedRatio = 0;
                if (midScore != null && midR > 0)   { fs += midScore * midR / 100.0;   usedRatio += midR; }
                if (finScore != null && finR > 0)    { fs += finScore * finR / 100.0;   usedRatio += finR; }
                if (quizScore != null && quizR > 0)  { fs += quizScore * quizR / 100.0; usedRatio += quizR; }
                if (hwScore != null && hwR > 0)      { fs += hwScore * hwR / 100.0;     usedRatio += hwR; }
                if (usedRatio > 0) {
                    finalScore = Math.round((fs / usedRatio) * 100 * 10.0) / 10.0;
                }
            }

            // [woo] 제출률 계산
            Integer submissionRate = null;
            if (totalHw > 0) {
                long submitted = submissionCountMap.getOrDefault(sid, 0L);
                submissionRate = (int) Math.round(submitted * 100.0 / totalHw);
            }

            summaryList.add(StudentSummaryDTO.builder()
                    .studentId(sid)
                    .studentName(student.getUser().getName())
                    .attendanceNum(assignment != null ? assignment.getAttendanceNum() : null)
                    .midterm(midScore)
                    .finalExam(finScore)
                    .quiz(quizScore)
                    .homework(hwScore)
                    .finalScore(finalScore)
                    .submissionRate(submissionRate)
                    .build());
        }

        // [woo] 순위 계산 (finalScore 기준 내림차순, null은 최하위)
        summaryList.sort((a, b) -> {
            if (a.getFinalScore() == null && b.getFinalScore() == null) return 0;
            if (a.getFinalScore() == null) return 1;
            if (b.getFinalScore() == null) return -1;
            return Double.compare(b.getFinalScore(), a.getFinalScore());
        });

        // [woo] 내신 석차 9등급 산출 (중간 석차 기반)
        // 동점자는 동일 석차, 중간 석차로 상위 백분위를 계산하여 등급 부여
        long scoredCount = summaryList.stream().filter(s -> s.getFinalScore() != null).count();
        int i = 0;
        while (i < (int) scoredCount) {
            StudentSummaryDTO cur = summaryList.get(i);
            int j = i;
            while (j < (int) scoredCount
                    && summaryList.get(j).getFinalScore() != null
                    && summaryList.get(j).getFinalScore().equals(cur.getFinalScore())) {
                j++;
            }
            // i~j-1: 동점자 그룹. 최상위 석차 = i+1, 최하위 = j
            int topRank = i + 1;
            double midRank = (topRank + j) / 2.0; // 중간 석차
            double pct = (midRank / scoredCount) * 100.0;
            String grade = calcGradeByPct(pct);
            for (int k = i; k < j; k++) {
                summaryList.get(k).setRank(topRank);
                summaryList.get(k).setGrade(grade);
            }
            i = j;
        }

        // [woo] 출석번호 기준으로 최종 정렬
        summaryList.sort((a, b) -> {
            if (a.getAttendanceNum() == null && b.getAttendanceNum() == null) return 0;
            if (a.getAttendanceNum() == null) return 1;
            if (b.getAttendanceNum() == null) return -1;
            return Integer.compare(a.getAttendanceNum(), b.getAttendanceNum());
        });

        // [woo] 통계 계산
        List<Double> scores = summaryList.stream()
                .map(StudentSummaryDTO::getFinalScore)
                .filter(s -> s != null)
                .collect(Collectors.toList());
        double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0);

        // [woo] 석차 9등급 분포
        java.util.LinkedHashMap<String, Long> gradeDist = new java.util.LinkedHashMap<>();
        for (String g : new String[]{"1", "2", "3", "4", "5", "6", "7", "8", "9"}) {
            gradeDist.put(g, summaryList.stream().filter(s -> g.equals(s.getGrade())).count());
        }
        java.util.LinkedHashMap<String, Long> scoreDist = new java.util.LinkedHashMap<>();
        scoreDist.put("90~100", scores.stream().filter(s -> s >= 90).count());
        scoreDist.put("80~89", scores.stream().filter(s -> s >= 80 && s < 90).count());
        scoreDist.put("70~79", scores.stream().filter(s -> s >= 70 && s < 80).count());
        scoreDist.put("60~69", scores.stream().filter(s -> s >= 60 && s < 70).count());
        scoreDist.put("60미만", scores.stream().filter(s -> s < 60).count());

        StatsSummaryDTO stats = StatsSummaryDTO.builder()
                .totalStudents(students.size())
                .average(Math.round(avg * 10.0) / 10.0)
                .gradeDist(gradeDist)
                .scoreDist(scoreDist)
                .build();

        SectionRatioDTO ratioDTO = getSectionRatio(sectionId, uid);
        ratioDTO.setSubjectId(section.getSubject().getId());
        ratioDTO.setSubjectName(section.getSubject().getName());

        return SectionSummaryDTO.builder()
                .students(summaryList)
                .ratio(ratioDTO)
                .stats(stats)
                .subjectName(section.getSubject().getName())
                .schoolYear(section.getTerm().getSchoolYear())
                .semester(section.getTerm().getSemester())
                .ratioSet(ratioSet)
                .ungradedCount(ungradedCount)
                .build();
    }

    // [woo] 담임교사 여부 확인 (User 방식 + TeacherInfo 방식 모두 지원)
    // AdminService는 classroom.teacher(User)로 담임 배정, 신규 방식은 homeroomTeacher(TeacherInfo)
    private boolean isHomeroomTeacher(com.example.schoolmate.common.entity.Classroom classroom,
                                       TeacherInfo teacher, Long uid) {
        if (classroom.getTeacher() != null && classroom.getTeacher().getUid().equals(uid)) return true;
        if (classroom.getHomeroomTeacher() != null
                && classroom.getHomeroomTeacher().getId().equals(teacher.getId())) return true;
        return false;
    }

    // [woo] 교사의 담임 학급 목록 조회 (두 방식 병합, 중복 제거)
    private List<com.example.schoolmate.common.entity.Classroom> getHomeroomClassrooms(
            TeacherInfo teacher, Long uid, int schoolYear) {
        List<com.example.schoolmate.common.entity.Classroom> result = new java.util.ArrayList<>();
        classroomRepository.findByTeacherUidAndYear(uid, schoolYear).ifPresent(result::add);
        classroomRepository.findByHomeroomTeacherIdAndYear(teacher.getId(), schoolYear).ifPresent(c -> {
            if (result.stream().noneMatch(existing -> existing.getCid().equals(c.getCid()))) {
                result.add(c);
            }
        });
        return result;
    }

    // [woo] 분반 → CourseSectionDTO 변환 헬퍼
    private CourseSectionDTO toCourseSectionDTO(CourseSection cs, AcademicTerm term, boolean homeroomAccess) {
        return CourseSectionDTO.builder()
                .courseSectionId(cs.getId())
                .subjectId(cs.getSubject().getId())
                .subjectName(cs.getSubject().getName())
                .classroomId(cs.getClassroom().getCid())
                .grade(cs.getClassroom().getGrade())
                .classNum(cs.getClassroom().getClassNum())
                .className(cs.getClassroom().getClassName())
                .schoolYear(term.getSchoolYear())
                .semester(term.getSemester())
                .homeroomAccess(homeroomAccess)
                .build();
    }

    // [woo] 내신 석차 9등급 산출 (중간 석차 상위 백분위 기준)
    // 상위 누적 4% 이하 → 1등급, 11% 이하 → 2등급, ..., 96% 초과 → 9등급
    private String calcGradeByPct(double pct) {
        if (pct <= 4)  return "1";
        if (pct <= 11) return "2";
        if (pct <= 23) return "3";
        if (pct <= 40) return "4";
        if (pct <= 60) return "5";
        if (pct <= 77) return "6";
        if (pct <= 89) return "7";
        if (pct <= 96) return "8";
        return "9";
    }

    // ========== [woo] 학부모: 자녀 담임교사 + 학급 성적 비교 ==========

    public ChildClassInfoDTO getChildClassInfo(Long parentUid, Long studentInfoId, Long termId) {
        // [woo] 학부모-자녀 관계 확인
        List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(parentUid);
        boolean isMyChild = relations.stream().anyMatch(r -> r.getStudentInfo().getId().equals(studentInfoId));
        if (!isMyChild) throw new SecurityException("본인의 자녀 정보만 조회할 수 있습니다.");

        StudentInfo child = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(child.getSchool().getId());

        // [woo] 담임교사 이름
        com.example.schoolmate.common.entity.info.assignment.StudentAssignment assignment = child.getCurrentAssignment();
        String homeroomTeacherName = null;
        String className = null;
        Long classroomId = null;
        if (assignment != null && assignment.getClassroom() != null) {
            com.example.schoolmate.common.entity.Classroom classroom = assignment.getClassroom();
            classroomId = classroom.getCid();
            className = classroom.getGrade() + "학년 " + classroom.getClassNum() + "반";
            // [woo] TeacherInfo 방식 우선, 없으면 User 방식
            if (classroom.getHomeroomTeacher() != null) {
                homeroomTeacherName = classroom.getHomeroomTeacher().getUser().getName();
            } else if (classroom.getTeacher() != null) {
                homeroomTeacherName = classroom.getTeacher().getName();
            }
        }

        // [woo] 학급 전체 성적 조회 → 과목별 평균 계산
        List<SubjectClassAvgDTO> classAvgs = java.util.Collections.emptyList();
        if (classroomId != null) {
            List<Grade> classGrades = gradeRepository.findByClassroomAndTerm(classroomId, term.getId());
            classAvgs = buildSubjectAvgs(classGrades);
        }

        // [woo] 학년 전체 성적 조회 → 동일 학교 + 동일 학년 모든 반 과목별 평균
        List<SubjectClassAvgDTO> gradeAvgs = java.util.Collections.emptyList();
        if (assignment != null && assignment.getClassroom() != null) {
            com.example.schoolmate.common.entity.Classroom classroom = assignment.getClassroom();
            Long schoolId = classroom.getSchool().getId();
            int gradeNum = classroom.getGrade();
            List<Grade> gradeGrades = gradeRepository.findBySchoolGradeAndTerm(schoolId, gradeNum, term.getId());
            gradeAvgs = buildSubjectAvgs(gradeGrades);
        }

        return ChildClassInfoDTO.builder()
                .homeroomTeacherName(homeroomTeacherName)
                .className(className)
                .termId(term.getId())
                .classAvgs(classAvgs)
                .gradeAvgs(gradeAvgs)
                .build();
    }

    // [woo] 학생: 본인 학급 평균 비교 정보
    public ChildClassInfoDTO getMyClassInfo(Long uid, Long termId) {
        StudentInfo student = studentInfoRepository.findByUserUidAndPrimaryTrue(uid)
                .or(() -> studentInfoRepository.findAllByUserUid(uid).stream().findFirst())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(student.getSchool().getId());

        com.example.schoolmate.common.entity.info.assignment.StudentAssignment assignment = student.getCurrentAssignment();
        String homeroomTeacherName = null;
        String className = null;
        Long classroomId = null;
        if (assignment != null && assignment.getClassroom() != null) {
            com.example.schoolmate.common.entity.Classroom classroom = assignment.getClassroom();
            classroomId = classroom.getCid();
            className = classroom.getGrade() + "학년 " + classroom.getClassNum() + "반";
            if (classroom.getHomeroomTeacher() != null) {
                homeroomTeacherName = classroom.getHomeroomTeacher().getUser().getName();
            } else if (classroom.getTeacher() != null) {
                homeroomTeacherName = classroom.getTeacher().getName();
            }
        }

        List<SubjectClassAvgDTO> classAvgs = java.util.Collections.emptyList();
        if (classroomId != null) {
            List<Grade> classGrades = gradeRepository.findByClassroomAndTerm(classroomId, term.getId());
            classAvgs = buildSubjectAvgs(classGrades);
        }

        // [woo] 학년 전체 성적 조회 → 동일 학교 + 동일 학년 모든 반 과목별 평균
        List<SubjectClassAvgDTO> gradeAvgs = java.util.Collections.emptyList();
        if (assignment != null && assignment.getClassroom() != null) {
            com.example.schoolmate.common.entity.Classroom classroom = assignment.getClassroom();
            Long schoolId = classroom.getSchool().getId();
            int gradeNum = classroom.getGrade();
            List<Grade> gradeGrades = gradeRepository.findBySchoolGradeAndTerm(schoolId, gradeNum, term.getId());
            gradeAvgs = buildSubjectAvgs(gradeGrades);
        }

        return ChildClassInfoDTO.builder()
                .homeroomTeacherName(homeroomTeacherName)
                .className(className)
                .termId(term.getId())
                .classAvgs(classAvgs)
                .gradeAvgs(gradeAvgs)
                .build();
    }

    // [woo] 성적 리스트 → 과목별 시험유형 평균 DTO 리스트 변환 (학급·학년 공통)
    private List<SubjectClassAvgDTO> buildSubjectAvgs(List<Grade> grades) {
        java.util.Map<String, java.util.Map<TestType, java.util.List<Double>>> subjectTypeScores = new java.util.HashMap<>();
        for (Grade g : grades) {
            if (g.getScore() == null) continue;
            String subj = g.getSubject().getName();
            subjectTypeScores.computeIfAbsent(subj, k -> new java.util.HashMap<>())
                    .computeIfAbsent(g.getTestType(), k -> new java.util.ArrayList<>())
                    .add(g.getScore());
        }
        return subjectTypeScores.entrySet().stream().map(e -> {
            java.util.Map<TestType, java.util.List<Double>> typeMap = e.getValue();
            return SubjectClassAvgDTO.builder()
                    .subjectName(e.getKey())
                    .midtermAvg(avgOf(typeMap.get(TestType.MIDTERMTEST)))
                    .finalAvg(avgOf(typeMap.get(TestType.FINALTEST)))
                    .quizAvg(avgOf(typeMap.get(TestType.QUIZ)))
                    .homeworkAvg(avgOf(typeMap.get(TestType.HOMEWORK)))
                    .build();
        }).collect(Collectors.toList());
    }

    private Double avgOf(java.util.List<Double> list) {
        if (list == null || list.isEmpty()) return null;
        double a = list.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        return Math.round(a * 10.0) / 10.0;
    }

    // [woo] 학부모용 자녀 클래스 정보 DTO
    @lombok.Builder
    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class ChildClassInfoDTO {
        private String homeroomTeacherName;
        private String className;
        private Long termId;
        private List<SubjectClassAvgDTO> classAvgs;
        // [woo] 학년 전체 평균 (동일 학교 + 동일 학년 모든 반)
        private List<SubjectClassAvgDTO> gradeAvgs;
    }

    // [woo] 과목별 학급 평균 DTO
    @lombok.Builder
    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class SubjectClassAvgDTO {
        private String subjectName;
        private Double midtermAvg;
        private Double finalAvg;
        private Double quizAvg;
        private Double homeworkAvg;
    }

    // [woo] 분반 응답 DTO (inner)
    @lombok.Builder
    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class CourseSectionDTO {
        private Long courseSectionId;
        private Long subjectId;
        private String subjectName;
        private Long classroomId;
        private Integer grade;
        private Integer classNum;
        private String className;
        private int schoolYear;
        private int semester;
        /** [woo] 담임교사 권한으로 열람 가능한 분반 (본인 담당 분반 아님 → 성적 입력 불가) */
        private boolean homeroomAccess;
    }

    // [woo] 학기 응답 DTO (inner)
    @lombok.Builder
    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class TermDTO {
        private Long termId;
        private int schoolYear;
        private int semester;
        private String displayName;
        private boolean active;
    }

    // [woo] 비율 설정 DTO (inner)
    @lombok.Builder
    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SectionRatioDTO {
        private Long sectionId;
        private Long subjectId;
        private String subjectName;
        private int midtermRatio;
        private int finalRatio;
        private int quizRatio;
        private int homeworkRatio;
    }

    // [woo] 학생별 성적 요약 DTO (inner)
    @lombok.Builder
    @lombok.Getter
    @lombok.Setter
    @lombok.AllArgsConstructor
    public static class StudentSummaryDTO {
        private Long studentId;
        private String studentName;
        private Integer attendanceNum;
        private Double midterm;
        private Double finalExam;
        private Double quiz;
        private Double homework;
        private Double finalScore;
        private String grade;
        private Integer rank;
        private Integer submissionRate;
    }

    // [woo] 분반 통계 DTO (inner)
    @lombok.Builder
    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class StatsSummaryDTO {
        private int totalStudents;
        private double average;
        private java.util.Map<String, Long> gradeDist;
        private java.util.Map<String, Long> scoreDist;
    }

    // [woo] 분반 성적 요약 응답 DTO (inner)
    @lombok.Builder
    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class SectionSummaryDTO {
        private List<StudentSummaryDTO> students;
        private SectionRatioDTO ratio;
        private StatsSummaryDTO stats;
        private String subjectName;
        private int schoolYear;
        private int semester;
        private boolean ratioSet; // [woo] 비율 설정 여부 — false면 성적 미표시
        private long ungradedCount; // [woo] 마감된 과제 중 미채점 제출 수 (교사 경고용)
    }
}
