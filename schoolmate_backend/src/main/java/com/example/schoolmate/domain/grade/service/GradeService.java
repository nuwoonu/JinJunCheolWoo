package com.example.schoolmate.domain.grade.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.parent.entity.FamilyRelation;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.student.entity.StudentAssignment;
import com.example.schoolmate.domain.user.entity.constant.TestType;
import com.example.schoolmate.domain.parent.repository.FamilyRelationRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.AcademicTermStatus;
import com.example.schoolmate.domain.term.entity.CourseSection;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;
import com.example.schoolmate.domain.classroom.repository.ClassroomRepository;
import com.example.schoolmate.domain.term.repository.CourseSectionRepository;
import com.example.schoolmate.domain.term.service.AcademicTermService;
import com.example.schoolmate.domain.homework.entity.Homework;
import com.example.schoolmate.domain.homework.entity.HomeworkSubmission;
import com.example.schoolmate.domain.homework.repository.HomeworkRepository;
import com.example.schoolmate.domain.homework.repository.HomeworkSubmissionRepository;
import com.example.schoolmate.domain.quiz.entity.Quiz;
import com.example.schoolmate.domain.quiz.repository.QuizRepository;
import com.example.schoolmate.domain.quiz.repository.QuizSubmissionRepository;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.GradeResponseDTO;
import com.example.schoolmate.domain.grade.entity.Grade;
import com.example.schoolmate.woo.entity.SectionRatio;
import com.example.schoolmate.domain.grade.repository.GradeRepository;
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

    public List<CourseSectionDTO> getMyCourseSections(Long uid, Long termId) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(teacher.getSchool().getId());

        List<CourseSection> ownSections = courseSectionRepository.findByTermAndTeacher(term, teacher);
        java.util.Set<Long> ownSectionIds = ownSections.stream()
                .map(CourseSection::getId).collect(Collectors.toSet());

        List<CourseSectionDTO> result = new java.util.ArrayList<>();
        ownSections.forEach(cs -> result.add(toCourseSectionDTO(cs, term, false)));

        List<com.example.schoolmate.domain.classroom.entity.Classroom> homeroomClassrooms =
                getHomeroomClassrooms(teacher, uid, term.getSchoolYearInt());
        for (com.example.schoolmate.domain.classroom.entity.Classroom hc : homeroomClassrooms) {
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
        if (!section.getTeacher().getId().equals(teacher.getId())
                && !isHomeroomTeacher(section.getClassroom(), teacher, uid)) {
            throw new SecurityException("본인이 담당하는 분반만 조회할 수 있습니다.");
        }

        int schoolYear = section.getTerm().getSchoolYearInt();
        List<StudentInfo> students = studentInfoRepository.findByClassroomIdAndSchoolYear(
                section.getClassroom().getCid(), schoolYear);
        if (students.isEmpty()) {
            students = studentInfoRepository.findByClassroomId(section.getClassroom().getCid());
        }

        List<Grade> existingGrades = gradeRepository.findBySectionAndTestType(
                section.getClassroom().getCid(),
                section.getSubject().getId(),
                section.getTerm().getId(),
                testType);

        java.util.Map<Long, Double> autoScores = java.util.Collections.emptyMap();
        if (testType == TestType.HOMEWORK) {
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

        final java.util.Map<Long, Double> finalAutoScores = autoScores;
        return students.stream().map(student -> {
            StudentAssignment assignment = student.getAssignments().stream()
                    .filter(a -> a.getSchoolYearInt() == schoolYear)
                    .findFirst().orElse(null);
            Grade grade = existingGrades.stream()
                    .filter(g -> g.getStudent().getId().equals(student.getId()))
                    .findFirst().orElse(null);

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
                    .schoolYear(section.getTerm().getSchoolYearInt())
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
        com.example.schoolmate.domain.classroom.entity.Classroom classroom =
                classroomRepository.findById(classroomId)
                        .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));
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

        int schoolYear = term.getSchoolYearInt();
        List<StudentInfo> students = studentInfoRepository.findByClassroomIdAndSchoolYear(classroomId, schoolYear);
        if (students.isEmpty()) {
            students = studentInfoRepository.findByClassroomId(classroomId);
        }
        List<Grade> grades = gradeRepository.findByClassroomAndTerm(classroomId, term.getId());

        List<GradeResponseDTO> result = new java.util.ArrayList<>();
        for (StudentInfo student : students) {
            StudentAssignment assignment = student.getAssignments().stream()
                    .filter(a -> a.getSchoolYearInt() == schoolYear)
                    .findFirst().orElse(null);
            List<Grade> studentGrades = grades.stream()
                    .filter(g -> g.getStudent().getId().equals(student.getId()))
                    .collect(Collectors.toList());
            if (studentGrades.isEmpty()) {
                result.add(GradeResponseDTO.builder()
                        .gradeId(null)
                        .studentId(student.getId())
                        .studentName(student.getUser().getName())
                        .attendanceNum(assignment != null ? assignment.getAttendanceNum() : null)
                        .subjectId(null)
                        .subjectName(null)
                        .testType(null)
                        .score(null)
                        .schoolYear(term.getSchoolYearInt())
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
        StudentInfo student = studentInfoRepository.findByUserUidAndPrimaryTrue(uid)
                .or(() -> studentInfoRepository.findAllByUserUid(uid).stream().findFirst())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(student.getSchool().getId());

        List<Grade> grades = gradeRepository.findByStudentAndTerm(student.getId(), term.getId());
        List<GradeResponseDTO> result = grades.stream().map(this::toResponseDTO).collect(Collectors.toList());

        boolean hasHomework = grades.stream().anyMatch(g -> g.getTestType() == TestType.HOMEWORK);
        if (!hasHomework) result.addAll(calcHomeworkGrades(student.getId(), term));

        boolean hasQuiz = grades.stream().anyMatch(g -> g.getTestType() == TestType.QUIZ);
        if (!hasQuiz) result.addAll(calcQuizGrades(student, term));

        return result;
    }

    private List<GradeResponseDTO> calcHomeworkGrades(Long studentId, AcademicTerm term) {
        List<HomeworkSubmission> submissions = homeworkSubmissionRepository
                .findGradedByStudentAndTerm(studentId, term.getId());
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
                    .schoolYear(term.getSchoolYearInt()).semester(term.getSemester())
                    .build();
        }).collect(Collectors.toList());
    }

    private List<GradeResponseDTO> calcQuizGrades(StudentInfo student, AcademicTerm term) {
        StudentAssignment assignment = student.getCurrentAssignment();
        if (assignment == null || assignment.getClassroom() == null) return java.util.Collections.emptyList();
        Long classroomId = assignment.getClassroom().getCid();

        List<com.example.schoolmate.domain.quiz.entity.QuizSubmission> submissions =
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
                .schoolYear(term.getSchoolYearInt()).semester(term.getSemester())
                .build());
    }

    // ========== [woo] 학부모: 자녀 성적 조회 ==========

    public List<GradeResponseDTO> getChildGrades(Long parentUid, Long studentInfoId, Long termId) {
        List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(parentUid);
        boolean isMyChild = relations.stream()
                .anyMatch(r -> r.getStudentInfo().getId().equals(studentInfoId));
        if (!isMyChild) throw new SecurityException("본인의 자녀 성적만 조회할 수 있습니다.");

        StudentInfo child = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));
        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(child.getSchool().getId());

        List<Grade> grades = gradeRepository.findByStudentAndTerm(studentInfoId, term.getId());
        List<GradeResponseDTO> result = grades.stream().map(this::toResponseDTO).collect(Collectors.toList());

        boolean hasHomework = grades.stream().anyMatch(g -> g.getTestType() == TestType.HOMEWORK);
        if (!hasHomework) result.addAll(calcHomeworkGrades(studentInfoId, term));

        boolean hasQuiz = grades.stream().anyMatch(g -> g.getTestType() == TestType.QUIZ);
        if (!hasQuiz) result.addAll(calcQuizGrades(child, term));

        return result;
    }

    // ========== [woo] 학급의 과목별 비율 전체 조회 ==========

    public List<SectionRatioDTO> getClassroomRatios(Long classroomId, Long termId, Long uid) {
        com.example.schoolmate.domain.classroom.entity.Classroom classroom =
                classroomRepository.findById(classroomId)
                        .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));
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

        List<CourseSection> sections = courseSectionRepository.findByTermAndClassroom(term, classroom);
        return sections.stream().map(section -> {
            SectionRatio ratio = sectionRatioRepository.findBySection_Id(section.getId()).orElse(null);
            if (ratio != null) return toRatioDTO(ratio);
            return SectionRatioDTO.builder()
                    .sectionId(section.getId())
                    .subjectId(section.getSubject().getId())
                    .subjectName(section.getSubject().getName())
                    .midtermRatio(50).finalRatio(50).quizRatio(0).homeworkRatio(0)
                    .build();
        }).collect(Collectors.toList());
    }

    // ========== [woo] 비율 설정 조회 ==========

    public SectionRatioDTO getSectionRatio(Long sectionId, Long uid) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("분반 정보를 찾을 수 없습니다."));
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        if (!section.getTeacher().getId().equals(teacher.getId())
                && !isHomeroomTeacher(section.getClassroom(), teacher, uid)) {
            throw new SecurityException("담당 교사 또는 담임교사만 비율을 조회할 수 있습니다.");
        }
        return sectionRatioRepository.findBySection_Id(sectionId)
                .map(this::toRatioDTO)
                .orElseGet(() -> SectionRatioDTO.builder()
                        .sectionId(sectionId)
                        .midtermRatio(50).finalRatio(50).quizRatio(0).homeworkRatio(0)
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
        if (total != 100) throw new IllegalArgumentException("비율의 합은 100이어야 합니다. (현재: " + total + ")");

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

    public List<TermDTO> getTermHistory(Long schoolId) {
        return academicTermService.getTermHistory(schoolId).stream()
                .map(t -> TermDTO.builder()
                        .termId(t.getId())
                        .schoolYear(t.getSchoolYearInt())
                        .semester(t.getSemester())
                        .displayName(t.getDisplayName())
                        .active(t.getStatus() == AcademicTermStatus.ACTIVE)
                        .build())
                .collect(Collectors.toList());
    }

    // ========== [woo] 내부 유틸 ==========

    public Long getSchoolIdByUid(Long uid) {
        return teacherInfoRepository.findByUserUid(uid)
                .filter(t -> t.getSchool() != null)
                .map(t -> t.getSchool().getId())
                .or(() -> studentInfoRepository.findByUserUidAndPrimaryTrue(uid)
                        .filter(s -> s.getSchool() != null)
                        .map(s -> s.getSchool().getId()))
                .or(() -> familyRelationRepository.findByParentInfo_User_Uid(uid).stream()
                        .findFirst()
                        .filter(r -> r.getStudentInfo() != null && r.getStudentInfo().getSchool() != null)
                        .map(r -> r.getStudentInfo().getSchool().getId()))
                .orElse(null);
    }

    private AcademicTerm findTermById(Long termId) {
        return academicTermRepository.findById(termId)
                .orElseThrow(() -> new IllegalArgumentException("학기 정보를 찾을 수 없습니다. id=" + termId));
    }

    private GradeResponseDTO toResponseDTO(Grade grade) {
        int schoolYear = grade.getAcademicTerm().getSchoolYearInt();
        StudentAssignment assignment = grade.getStudent().getAssignments().stream()
                .filter(a -> a.getSchoolYearInt() == schoolYear)
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
                .schoolYear(grade.getAcademicTerm().getSchoolYearInt())
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
        if (!section.getTeacher().getId().equals(teacher.getId())
                && !isHomeroomTeacher(section.getClassroom(), teacher, uid)) {
            throw new SecurityException("본인이 담당하는 분반 또는 담임 학급만 조회할 수 있습니다.");
        }

        int schoolYear = section.getTerm().getSchoolYearInt();
        Long classroomId = section.getClassroom().getCid();
        Long sectionTeacherId = section.getTeacher().getId();

        List<StudentInfo> students = studentInfoRepository.findByClassroomIdAndSchoolYear(classroomId, schoolYear);
        if (students.isEmpty()) students = studentInfoRepository.findByClassroomId(classroomId);

        List<Grade> midGrades = gradeRepository.findBySectionAndTestType(
                classroomId, section.getSubject().getId(), section.getTerm().getId(), TestType.MIDTERMTEST);
        List<Grade> finalGrades = gradeRepository.findBySectionAndTestType(
                classroomId, section.getSubject().getId(), section.getTerm().getId(), TestType.FINALTEST);

        java.util.Map<Long, Double> homeworkScores = new java.util.HashMap<>();
        long ungradedCount = homeworkSubmissionRepository.countUngradedByPastDueSectionId(sectionId);
        {
            List<Homework> pastDueHomeworks = homeworkRepository.findPastDueBySectionId(sectionId);
            List<HomeworkSubmission> allSubmissions = homeworkSubmissionRepository.findAllByPastDueSectionId(sectionId);
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
                        tmpMap.computeIfAbsent(sid, k -> new java.util.ArrayList<>()).add(0.0);
                    } else if (sub.getStatus() == HomeworkSubmission.SubmissionStatus.GRADED && sub.getScore() != null) {
                        double normalized = maxScore > 0 ? sub.getScore() * 100.0 / maxScore : 0;
                        tmpMap.computeIfAbsent(sid, k -> new java.util.ArrayList<>()).add(normalized);
                    }
                }
            }
            for (var e : tmpMap.entrySet()) {
                double avg = e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
                homeworkScores.put(e.getKey(), Math.round(avg * 10.0) / 10.0);
            }
        }

        java.util.Map<Long, Double> quizScores = new java.util.HashMap<>();
        {
            List<Quiz> quizzes = quizRepository.findByCourseSection(sectionId);
            if (quizzes.isEmpty()) quizzes = quizRepository.findByTeacherAndClassroom(sectionTeacherId, classroomId);
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

        // [woo] 수동 입력된 Grade(HOMEWORK/QUIZ)를 자동계산 점수 없는 학생에 대해 fallback으로 사용
        {
            List<Grade> hwGrades = gradeRepository.findBySectionAndTestType(
                    classroomId, section.getSubject().getId(), section.getTerm().getId(), TestType.HOMEWORK);
            for (Grade g : hwGrades) {
                Long sid = g.getStudent().getId();
                if (!homeworkScores.containsKey(sid) && g.getScore() != null) {
                    homeworkScores.put(sid, g.getScore());
                }
            }
            List<Grade> quizGradesList = gradeRepository.findBySectionAndTestType(
                    classroomId, section.getSubject().getId(), section.getTerm().getId(), TestType.QUIZ);
            for (Grade g : quizGradesList) {
                Long sid = g.getStudent().getId();
                if (!quizScores.containsKey(sid) && g.getScore() != null) {
                    quizScores.put(sid, g.getScore());
                }
            }
        }

        SectionRatio ratioEntity = sectionRatioRepository.findBySection_Id(sectionId).orElse(null);
        boolean ratioSet = ratioEntity != null;
        int midR  = ratioSet ? ratioEntity.getMidtermRatio() : 0;
        int finR  = ratioSet ? ratioEntity.getFinalRatio()   : 0;
        int quizR = ratioSet ? ratioEntity.getQuizRatio()    : 0;
        int hwR   = ratioSet ? ratioEntity.getHomeworkRatio(): 0;

        List<Homework> allHomeworks = homeworkRepository.findBySectionId(sectionId);
        int totalHw = allHomeworks.size();
        java.util.Map<Long, Long> submissionCountMap = new java.util.HashMap<>();
        if (totalHw > 0) {
            List<Object[]> counts = homeworkSubmissionRepository.countByStudentForSection(sectionId);
            for (Object[] row : counts) {
                submissionCountMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }

        List<StudentSummaryDTO> summaryList = new java.util.ArrayList<>();
        for (StudentInfo student : students) {
            Long sid = student.getId();
            StudentAssignment assignment = student.getAssignments().stream()
                    .filter(a -> a.getSchoolYearInt() == schoolYear)
                    .findFirst().orElse(null);

            Double midScore  = midGrades.stream().filter(g -> g.getStudent().getId().equals(sid)).findFirst().map(Grade::getScore).orElse(null);
            Double finScore  = finalGrades.stream().filter(g -> g.getStudent().getId().equals(sid)).findFirst().map(Grade::getScore).orElse(null);
            Double quizScore = quizScores.get(sid);
            Double hwScore   = homeworkScores.get(sid);

            Double finalScore = null;
            if (ratioSet) {
                double fs = 0; int usedRatio = 0;
                if (midScore  != null && midR  > 0) { fs += midScore  * midR  / 100.0; usedRatio += midR;  }
                if (finScore  != null && finR  > 0) { fs += finScore  * finR  / 100.0; usedRatio += finR;  }
                if (quizScore != null && quizR > 0) { fs += quizScore * quizR / 100.0; usedRatio += quizR; }
                if (hwScore   != null && hwR   > 0) { fs += hwScore   * hwR   / 100.0; usedRatio += hwR;   }
                if (usedRatio > 0) finalScore = Math.round((fs / usedRatio) * 100 * 10.0) / 10.0;
            }

            Integer submissionRate = null;
            if (totalHw > 0) {
                long submitted = submissionCountMap.getOrDefault(sid, 0L);
                submissionRate = (int) Math.round(submitted * 100.0 / totalHw);
            }

            summaryList.add(StudentSummaryDTO.builder()
                    .studentId(sid).studentName(student.getUser().getName())
                    .attendanceNum(assignment != null ? assignment.getAttendanceNum() : null)
                    .midterm(midScore).finalExam(finScore).quiz(quizScore).homework(hwScore)
                    .finalScore(finalScore).submissionRate(submissionRate)
                    .build());
        }

        summaryList.sort((a, b) -> {
            if (a.getFinalScore() == null && b.getFinalScore() == null) return 0;
            if (a.getFinalScore() == null) return 1;
            if (b.getFinalScore() == null) return -1;
            return Double.compare(b.getFinalScore(), a.getFinalScore());
        });

        long scoredCount = summaryList.stream().filter(s -> s.getFinalScore() != null).count();
        int i = 0;
        while (i < (int) scoredCount) {
            StudentSummaryDTO cur = summaryList.get(i);
            int j = i;
            while (j < (int) scoredCount
                    && summaryList.get(j).getFinalScore() != null
                    && summaryList.get(j).getFinalScore().equals(cur.getFinalScore())) j++;
            int topRank = i + 1;
            // [woo] 절대평가: 최종점수(0~100)를 10점 단위로 1~9등급 산출
            String gradeLabel = calcGradeByScore(cur.getFinalScore());
            for (int k = i; k < j; k++) {
                summaryList.get(k).setRank(topRank);
                summaryList.get(k).setGrade(gradeLabel);
            }
            i = j;
        }

        summaryList.sort((a, b) -> {
            if (a.getAttendanceNum() == null && b.getAttendanceNum() == null) return 0;
            if (a.getAttendanceNum() == null) return 1;
            if (b.getAttendanceNum() == null) return -1;
            return Integer.compare(a.getAttendanceNum(), b.getAttendanceNum());
        });

        List<Double> scores = summaryList.stream()
                .map(StudentSummaryDTO::getFinalScore).filter(s -> s != null).collect(Collectors.toList());
        double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0);

        java.util.LinkedHashMap<String, Long> gradeDist = new java.util.LinkedHashMap<>();
        for (String g : new String[]{"1","2","3","4","5","6","7","8","9"})
            gradeDist.put(g, summaryList.stream().filter(s -> g.equals(s.getGrade())).count());
        java.util.LinkedHashMap<String, Long> scoreDist = new java.util.LinkedHashMap<>();
        scoreDist.put("90~100", scores.stream().filter(s -> s >= 90).count());
        scoreDist.put("80~89",  scores.stream().filter(s -> s >= 80 && s < 90).count());
        scoreDist.put("70~79",  scores.stream().filter(s -> s >= 70 && s < 80).count());
        scoreDist.put("60~69",  scores.stream().filter(s -> s >= 60 && s < 70).count());
        scoreDist.put("60미만", scores.stream().filter(s -> s < 60).count());

        StatsSummaryDTO stats = StatsSummaryDTO.builder()
                .totalStudents(students.size())
                .average(Math.round(avg * 10.0) / 10.0)
                .gradeDist(gradeDist).scoreDist(scoreDist)
                .build();

        SectionRatioDTO ratioDTO = getSectionRatio(sectionId, uid);
        ratioDTO.setSubjectId(section.getSubject().getId());
        ratioDTO.setSubjectName(section.getSubject().getName());

        return SectionSummaryDTO.builder()
                .students(summaryList).ratio(ratioDTO).stats(stats)
                .subjectName(section.getSubject().getName())
                .schoolYear(section.getTerm().getSchoolYearInt())
                .semester(section.getTerm().getSemester())
                .ratioSet(ratioSet).ungradedCount(ungradedCount)
                .build();
    }

    // ========== [woo] 학부모: 자녀 담임교사 + 학급 성적 비교 ==========

    public ChildClassInfoDTO getChildClassInfo(Long parentUid, Long studentInfoId, Long termId) {
        List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(parentUid);
        boolean isMyChild = relations.stream().anyMatch(r -> r.getStudentInfo().getId().equals(studentInfoId));
        if (!isMyChild) throw new SecurityException("본인의 자녀 정보만 조회할 수 있습니다.");

        StudentInfo child = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        AcademicTerm term = (termId != null)
                ? findTermById(termId)
                : academicTermService.getCurrentTerm(child.getSchool().getId());

        com.example.schoolmate.domain.student.entity.StudentAssignment assignment = child.getCurrentAssignment();
        String homeroomTeacherName = null;
        String className = null;
        Long classroomId = null;
        if (assignment != null && assignment.getClassroom() != null) {
            com.example.schoolmate.domain.classroom.entity.Classroom classroom = assignment.getClassroom();
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

        List<SubjectClassAvgDTO> gradeAvgs = java.util.Collections.emptyList();
        if (assignment != null && assignment.getClassroom() != null) {
            com.example.schoolmate.domain.classroom.entity.Classroom classroom = assignment.getClassroom();
            Long schoolId = classroom.getSchool().getId();
            int gradeNum = classroom.getGrade();
            List<Grade> gradeGrades = gradeRepository.findBySchoolGradeAndTerm(schoolId, gradeNum, term.getId());
            gradeAvgs = buildSubjectAvgs(gradeGrades);
        }

        return ChildClassInfoDTO.builder()
                .homeroomTeacherName(homeroomTeacherName).className(className)
                .termId(term.getId()).classAvgs(classAvgs).gradeAvgs(gradeAvgs)
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

        com.example.schoolmate.domain.student.entity.StudentAssignment assignment = student.getCurrentAssignment();
        String homeroomTeacherName = null;
        String className = null;
        Long classroomId = null;
        if (assignment != null && assignment.getClassroom() != null) {
            com.example.schoolmate.domain.classroom.entity.Classroom classroom = assignment.getClassroom();
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

        List<SubjectClassAvgDTO> gradeAvgs = java.util.Collections.emptyList();
        if (assignment != null && assignment.getClassroom() != null) {
            com.example.schoolmate.domain.classroom.entity.Classroom classroom = assignment.getClassroom();
            Long schoolId = classroom.getSchool().getId();
            int gradeNum = classroom.getGrade();
            List<Grade> gradeGrades = gradeRepository.findBySchoolGradeAndTerm(schoolId, gradeNum, term.getId());
            gradeAvgs = buildSubjectAvgs(gradeGrades);
        }

        return ChildClassInfoDTO.builder()
                .homeroomTeacherName(homeroomTeacherName).className(className)
                .termId(term.getId()).classAvgs(classAvgs).gradeAvgs(gradeAvgs)
                .build();
    }

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

    private boolean isHomeroomTeacher(com.example.schoolmate.domain.classroom.entity.Classroom classroom,
                                       TeacherInfo teacher, Long uid) {
        if (classroom.getTeacher() != null && classroom.getTeacher().getUid().equals(uid)) return true;
        if (classroom.getHomeroomTeacher() != null
                && classroom.getHomeroomTeacher().getId().equals(teacher.getId())) return true;
        return false;
    }

    private List<com.example.schoolmate.domain.classroom.entity.Classroom> getHomeroomClassrooms(
            TeacherInfo teacher, Long uid, int schoolYear) {
        List<com.example.schoolmate.domain.classroom.entity.Classroom> result = new java.util.ArrayList<>();
        classroomRepository.findByTeacherUidAndSchoolYear_Year(uid, schoolYear).ifPresent(result::add);
        classroomRepository.findByHomeroomTeacherIdAndSchoolYear_Year(teacher.getId(), schoolYear).ifPresent(c -> {
            if (result.stream().noneMatch(existing -> existing.getCid().equals(c.getCid()))) result.add(c);
        });
        return result;
    }

    private CourseSectionDTO toCourseSectionDTO(CourseSection cs, AcademicTerm term, boolean homeroomAccess) {
        return CourseSectionDTO.builder()
                .courseSectionId(cs.getId()).subjectId(cs.getSubject().getId())
                .subjectName(cs.getSubject().getName()).classroomId(cs.getClassroom().getCid())
                .grade(cs.getClassroom().getGrade()).classNum(cs.getClassroom().getClassNum())
                .className(cs.getClassroom().getClassName())
                .schoolYear(term.getSchoolYearInt()).semester(term.getSemester())
                .homeroomAccess(homeroomAccess)
                .build();
    }

    // [woo] 절대평가 9등급: 90점↑→1, 80점↑→2, ... 10점 단위
    private String calcGradeByScore(double score) {
        if (score >= 90) return "1";
        if (score >= 80) return "2";
        if (score >= 70) return "3";
        if (score >= 60) return "4";
        if (score >= 50) return "5";
        if (score >= 40) return "6";
        if (score >= 30) return "7";
        if (score >= 20) return "8";
        return "9";
    }

    // ========== [woo] Inner DTOs ==========

    @lombok.Builder @lombok.Getter @lombok.AllArgsConstructor
    public static class ChildClassInfoDTO {
        private String homeroomTeacherName;
        private String className;
        private Long termId;
        private List<SubjectClassAvgDTO> classAvgs;
        private List<SubjectClassAvgDTO> gradeAvgs;
    }

    @lombok.Builder @lombok.Getter @lombok.AllArgsConstructor
    public static class SubjectClassAvgDTO {
        private String subjectName;
        private Double midtermAvg;
        private Double finalAvg;
        private Double quizAvg;
        private Double homeworkAvg;
    }

    @lombok.Builder @lombok.Getter @lombok.AllArgsConstructor
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
        private boolean homeroomAccess;
    }

    @lombok.Builder @lombok.Getter @lombok.AllArgsConstructor
    public static class TermDTO {
        private Long termId;
        private int schoolYear;
        private int semester;
        private String displayName;
        private boolean active;
    }

    @lombok.Builder @lombok.Getter @lombok.Setter @lombok.NoArgsConstructor @lombok.AllArgsConstructor
    public static class SectionRatioDTO {
        private Long sectionId;
        private Long subjectId;
        private String subjectName;
        private int midtermRatio;
        private int finalRatio;
        private int quizRatio;
        private int homeworkRatio;
    }

    @lombok.Builder @lombok.Getter @lombok.Setter @lombok.AllArgsConstructor
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

    @lombok.Builder @lombok.Getter @lombok.AllArgsConstructor
    public static class StatsSummaryDTO {
        private int totalStudents;
        private double average;
        private java.util.Map<String, Long> gradeDist;
        private java.util.Map<String, Long> scoreDist;
    }

    @lombok.Builder @lombok.Getter @lombok.AllArgsConstructor
    public static class SectionSummaryDTO {
        private List<StudentSummaryDTO> students;
        private SectionRatioDTO ratio;
        private StatsSummaryDTO stats;
        private String subjectName;
        private int schoolYear;
        private int semester;
        private boolean ratioSet;
        private long ungradedCount;
    }
}
