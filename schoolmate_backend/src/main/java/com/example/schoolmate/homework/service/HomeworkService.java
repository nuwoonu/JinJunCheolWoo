package com.example.schoolmate.homework.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.domain.term.entity.CourseSection;
import com.example.schoolmate.common.repository.info.FamilyRelationRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.domain.term.repository.CourseSectionRepository;
import com.example.schoolmate.common.service.FileManager;
import com.example.schoolmate.dto.CustomUserDTO;
import com.example.schoolmate.homework.dto.HomeworkDTO;
import com.example.schoolmate.homework.entity.Homework;
import com.example.schoolmate.homework.entity.HomeworkStatus;
import com.example.schoolmate.homework.entity.HomeworkSubmission;
import com.example.schoolmate.homework.repository.HomeworkRepository;
import com.example.schoolmate.homework.repository.HomeworkSubmissionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [woo] 과제 서비스
 * - 교사: 과제 출제, 수정, 삭제, 채점
 * - 학생: 과제 조회, 제출
 * - 학부모: 자녀 과제 제출 현황 조회 (FamilyRelation → StudentInfo 경로)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeworkService {

    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository submissionRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final FileManager fileManager;

    // ========== [woo] 과제 출제 (교사) ==========

    @Transactional
    public HomeworkDTO.DetailResponse createHomework(HomeworkDTO.CreateRequest request,
            MultipartFile file, CustomUserDTO userDTO) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        CourseSection courseSection = courseSectionRepository.findById(request.getCourseSectionId())
                .orElseThrow(() -> new IllegalArgumentException("수업 분반 정보를 찾을 수 없습니다."));

        if (!courseSection.getTeacher().getId().equals(teacher.getId())) {
            throw new SecurityException("본인이 담당하는 수업 분반에만 과제를 출제할 수 있습니다.");
        }

        String savedFilename = fileManager.upload(file, FileManager.UploadType.HOMEWORK);
        String originalFilename = (savedFilename != null) ? file.getOriginalFilename() : null;

        Homework homework = Homework.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .courseSection(courseSection)
                .dueDate(request.getDueDate())
                .maxScore(request.getMaxScore() != null ? request.getMaxScore() : 100)
                .attachmentUrl(savedFilename)
                .attachmentOriginalName(originalFilename)
                .build();

        Homework saved = homeworkRepository.save(homework);
        int totalStudents = studentInfoRepository.findByClassroomCid(courseSection.getClassroom().getCid()).size();

        log.info("[woo] 과제 출제: {} - {} (분반: {}, 교사: {})",
                saved.getId(), saved.getTitle(),
                courseSection.getDisplayName(),
                teacher.getUser().getName());

        return HomeworkDTO.DetailResponse.fromEntity(saved, totalStudents);
    }

    // ========== [woo] 교사 수업 분반 목록 (과제 출제용) ==========

    public List<Map<String, Object>> getTeacherCourseSections(CustomUserDTO userDTO) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        return courseSectionRepository.findAllByTeacherWithDetails(teacher).stream()
                .map(cs -> Map.<String, Object>of(
                        "id", cs.getId(),
                        "name", cs.getSubject().getName() + " - " + cs.getClassroom().getClassName(),
                        "subjectName", cs.getSubject().getName(),
                        "classroomName", cs.getClassroom().getClassName(),
                        "classroomId", cs.getClassroom().getCid()))
                .collect(Collectors.toList());
    }

    // ========== [woo] 과제 목록 조회 ==========

    /**
     * 교사용: 내가 출제한 과제 목록
     */
    public Page<HomeworkDTO.ListResponse> getMyHomeworks(CustomUserDTO userDTO, Pageable pageable) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        return homeworkRepository.findByTeacherInfoId(teacher.getId(), pageable)
                .map(hw -> {
                    int total = studentInfoRepository.findByClassroomCid(hw.getCourseSection().getClassroom().getCid()).size();
                    return HomeworkDTO.ListResponse.fromEntity(hw, total);
                });
    }

    /**
     * 학생용: 내 학급의 과제 목록
     */
    public Page<HomeworkDTO.ListResponse> getClassroomHomeworks(CustomUserDTO userDTO, Pageable pageable) {
        StudentInfo student = studentInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        if (student.getCurrentAssignment() == null || student.getCurrentAssignment().getClassroom() == null) {
            throw new IllegalArgumentException("학급 배정 정보가 없습니다.");
        }

        Long classroomId = student.getCurrentAssignment().getClassroom().getCid();
        int total = studentInfoRepository.findByClassroomCid(classroomId).size();

        return homeworkRepository.findByClassroomId(classroomId, pageable)
                .map(hw -> {
                    HomeworkDTO.ListResponse resp = HomeworkDTO.ListResponse.fromEntity(hw, total);
                    submissionRepository.findByHomeworkIdAndStudentId(hw.getId(), student.getId())
                            .ifPresentOrElse(sub -> {
                                resp.setSubmitted(true);
                                resp.setScore(sub.getScore());
                                resp.setFeedback(sub.getFeedback());
                                resp.setSubmissionStatus(sub.getStatus());
                            }, () -> resp.setSubmitted(false));
                    return resp;
                });
    }

    /**
     * [woo] 학부모용: 자녀의 과제 목록 + 제출 여부
     */
    public List<HomeworkDTO.ListResponse> getChildHomeworks(CustomUserDTO userDTO, Long childUserUid) {
        StudentInfo child = studentInfoRepository.findByUserUid(childUserUid)
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

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
        int total = studentInfoRepository.findByClassroomCid(classroomId).size();
        List<Homework> homeworks = homeworkRepository.findAllByClassroomId(classroomId);

        return homeworks.stream().map(hw -> {
            HomeworkDTO.ListResponse resp = HomeworkDTO.ListResponse.fromEntity(hw, total);
            resp.setSubmitted(submissionRepository.existsByHomeworkIdAndStudentId(hw.getId(), child.getId()));
            return resp;
        }).collect(Collectors.toList());
    }

    // ========== [woo] 과제 상세 조회 ==========

    public HomeworkDTO.DetailResponse getHomework(Long homeworkId, CustomUserDTO userDTO) {
        Homework homework = findHomeworkOrThrow(homeworkId);
        int total = studentInfoRepository.findByClassroomCid(homework.getCourseSection().getClassroom().getCid()).size();

        HomeworkDTO.DetailResponse response = HomeworkDTO.DetailResponse.fromEntity(homework, total);

        if (isTeacher(userDTO) || isAdmin(userDTO)) {
            List<HomeworkDTO.SubmissionResponse> subs = homework.getSubmissions().stream()
                    .map(HomeworkDTO.SubmissionResponse::fromEntity)
                    .collect(Collectors.toList());
            response.setSubmissions(subs);
        }

        if (isStudent(userDTO)) {
            StudentInfo student = studentInfoRepository.findByUserUid(userDTO.getUid()).orElse(null);
            if (student != null) {
                submissionRepository.findByHomeworkIdAndStudentId(homeworkId, student.getId())
                        .ifPresent(sub -> response.setMySubmission(HomeworkDTO.SubmissionResponse.fromEntity(sub)));
            }
        }

        return response;
    }

    // ========== [woo] 과제 수정 (교사) ==========

    @Transactional
    public HomeworkDTO.DetailResponse updateHomework(Long homeworkId, HomeworkDTO.CreateRequest request,
            MultipartFile file, CustomUserDTO userDTO) {
        Homework homework = findHomeworkOrThrow(homeworkId);
        validateTeacherOwner(homework, userDTO);

        homework.setTitle(request.getTitle());
        homework.setContent(request.getContent());
        homework.setDueDate(request.getDueDate());
        if (request.getMaxScore() != null) {
            homework.setMaxScore(request.getMaxScore());
        }

        if (file != null && !file.isEmpty()) {
            homework.setAttachmentUrl(fileManager.replace(file, homework.getAttachmentUrl(), FileManager.UploadType.HOMEWORK));
            homework.setAttachmentOriginalName(file.getOriginalFilename());
        }

        int total = studentInfoRepository.findByClassroomCid(homework.getCourseSection().getClassroom().getCid()).size();
        log.info("[woo] 과제 수정: {} by {}", homeworkId, userDTO.getName());
        return HomeworkDTO.DetailResponse.fromEntity(homework, total);
    }

    // ========== [woo] 과제 삭제 (교사, soft delete) ==========

    @Transactional
    public void deleteHomework(Long homeworkId, CustomUserDTO userDTO) {
        Homework homework = findHomeworkOrThrow(homeworkId);
        validateTeacherOwner(homework, userDTO);

        fileManager.delete(homework.getAttachmentUrl(), FileManager.UploadType.HOMEWORK);
        homework.delete();
        log.info("[woo] 과제 삭제: {} by {}", homeworkId, userDTO.getName());
    }

    // ========== [woo] 과제 제출 (학생) ==========

    @Transactional
    public HomeworkDTO.SubmissionResponse submitHomework(Long homeworkId, HomeworkDTO.SubmitRequest request,
            MultipartFile file, CustomUserDTO userDTO) {
        Homework homework = findHomeworkOrThrow(homeworkId);

        if (homework.getStatus() == HomeworkStatus.CLOSED) {
            throw new IllegalArgumentException("마감된 과제입니다.");
        }

        StudentInfo student = studentInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        if (student.getCurrentAssignment() == null
                || !student.getCurrentAssignment().getClassroom().getCid()
                        .equals(homework.getCourseSection().getClassroom().getCid())) {
            throw new SecurityException("해당 학급의 학생만 제출할 수 있습니다.");
        }

        if (submissionRepository.existsByHomeworkIdAndStudentId(homeworkId, student.getId())) {
            throw new IllegalArgumentException("이미 제출한 과제입니다.");
        }

        String savedFilename = fileManager.upload(file, FileManager.UploadType.HOMEWORK);
        String originalFilename = (savedFilename != null) ? file.getOriginalFilename() : null;

        HomeworkSubmission.SubmissionStatus status = homework.isOverdue()
                ? HomeworkSubmission.SubmissionStatus.LATE
                : HomeworkSubmission.SubmissionStatus.SUBMITTED;

        HomeworkSubmission submission = HomeworkSubmission.builder()
                .homework(homework)
                .student(student)
                .content(request.getContent())
                .attachmentUrl(savedFilename)
                .attachmentOriginalName(originalFilename)
                .submittedAt(LocalDateTime.now())
                .status(status)
                .build();

        HomeworkSubmission saved = submissionRepository.save(submission);
        log.info("[woo] 과제 제출: 과제={}, 학생={}", homeworkId, student.getUser().getName());
        return HomeworkDTO.SubmissionResponse.fromEntity(saved);
    }

    // ========== [woo] 제출 수정 (학생, 마감 전·미채점 한정) ==========

    @Transactional
    public HomeworkDTO.SubmissionResponse updateSubmission(Long submissionId, HomeworkDTO.SubmitRequest request,
            MultipartFile file, CustomUserDTO userDTO) {
        HomeworkSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("제출 정보를 찾을 수 없습니다."));

        StudentInfo student = studentInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        if (!submission.getStudent().getId().equals(student.getId())) {
            throw new SecurityException("본인의 제출물만 수정할 수 있습니다.");
        }

        Homework homework = submission.getHomework();
        if (homework.getStatus() == HomeworkStatus.CLOSED) {
            throw new IllegalArgumentException("마감된 과제는 수정할 수 없습니다.");
        }
        if (homework.getDueDate() != null && LocalDateTime.now().isAfter(homework.getDueDate())) {
            throw new IllegalArgumentException("마감일이 지난 과제는 수정할 수 없습니다.");
        }
        if (submission.getStatus() == HomeworkSubmission.SubmissionStatus.GRADED) {
            throw new IllegalArgumentException("채점 완료된 제출물은 수정할 수 없습니다.");
        }

        submission.setContent(request.getContent());
        if (file != null && !file.isEmpty()) {
            submission.setAttachmentUrl(fileManager.replace(file, submission.getAttachmentUrl(), FileManager.UploadType.HOMEWORK));
            submission.setAttachmentOriginalName(file.getOriginalFilename());
        }
        submission.setSubmittedAt(LocalDateTime.now());

        log.info("[woo] 제출 수정: 제출={}, 학생={}", submissionId, student.getUser().getName());
        return HomeworkDTO.SubmissionResponse.fromEntity(submission);
    }

    // ========== [woo] 채점 (교사) ==========

    @Transactional
    public HomeworkDTO.SubmissionResponse gradeSubmission(Long submissionId, HomeworkDTO.GradeRequest request,
            CustomUserDTO userDTO) {
        HomeworkSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("제출 정보를 찾을 수 없습니다."));

        validateTeacherOwner(submission.getHomework(), userDTO);

        submission.grade(request.getScore(), request.getFeedback());
        log.info("[woo] 과제 채점: 제출={}, 점수={} by {}", submissionId, request.getScore(), userDTO.getName());
        return HomeworkDTO.SubmissionResponse.fromEntity(submission);
    }

    // ========== [woo] 과제 상태 변경 (교사) ==========

    @Transactional
    public void changeHomeworkStatus(Long homeworkId, HomeworkStatus status, CustomUserDTO userDTO) {
        Homework homework = findHomeworkOrThrow(homeworkId);
        validateTeacherOwner(homework, userDTO);

        homework.changeStatus(status);
        log.info("[woo] 과제 상태 변경: {} → {} by {}", homeworkId, status, userDTO.getName());
    }

    // ========== 헬퍼 메서드 ==========

    private Homework findHomeworkOrThrow(Long homeworkId) {
        Homework homework = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new IllegalArgumentException("과제를 찾을 수 없습니다: " + homeworkId));
        if (homework.isDeleted()) {
            throw new IllegalArgumentException("삭제된 과제입니다.");
        }
        return homework;
    }

    private void validateTeacherOwner(Homework homework, CustomUserDTO userDTO) {
        if (isAdmin(userDTO)) return;

        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userDTO.getUid())
                .orElseThrow(() -> new SecurityException("교사 정보를 찾을 수 없습니다."));

        if (!homework.getCourseSection().getTeacher().getId().equals(teacher.getId())) {
            throw new SecurityException("본인이 출제한 과제만 수정/삭제할 수 있습니다.");
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
