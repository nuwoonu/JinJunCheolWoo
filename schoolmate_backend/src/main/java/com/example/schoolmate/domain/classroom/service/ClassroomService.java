package com.example.schoolmate.domain.classroom.service;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.opencsv.bean.CsvToBeanBuilder;

import com.example.schoolmate.domain.classroom.dto.ClassDTO;
import com.example.schoolmate.domain.teacher.dto.TeacherDTO;
import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.classroom.entity.constant.ClassroomStatus;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.student.entity.StudentAssignment;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.repository.UserRepository;

import com.example.schoolmate.domain.classroom.repository.ClassroomRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.global.util.LogHelper;
import com.example.schoolmate.global.util.NotificationHelper;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.term.entity.SchoolYear;
import com.example.schoolmate.domain.term.entity.SchoolYearStatus;
import com.example.schoolmate.domain.term.repository.SchoolYearRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 관리자 학급 관리 서비스
 *
 * 학급 엔티티에 대한 비즈니스 로직을 수행합니다.
 * - 학급 생성 시 중복 체크, 학생 배정/제외 로직
 * - 학급 상태 변경 및 변경 이력(History) 기록
 */
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolYearRepository schoolYearRepository;

    @Transactional(readOnly = true)
    public Page<ClassDTO.DetailResponse> getClassList(ClassDTO.SearchCondition cond, Pageable pageable) {
        return classroomRepository.search(cond, pageable)
                .map(c -> {
                    long count = studentInfoRepository.countByClassroom(c.getYear(), c.getGrade(), c.getClassNum());
                    return ClassDTO.DetailResponse.from(c, (int) count);
                });
    }

    @Transactional(readOnly = true)
    public ClassDTO.DetailResponse getClassDetail(Long cid) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        List<User> students = studentInfoRepository.findStudentsByAssignment(
                classroom.getYear(), classroom.getGrade(), classroom.getClassNum());

        ClassDTO.DetailResponse response = ClassDTO.DetailResponse.from(classroom, students.size());

        List<ClassDTO.StudentSummary> studentSummaries = students.stream().map(u -> {
            StudentInfo info = u.getInfo(StudentInfo.class);
            StudentAssignment assign = info.getAssignments().stream()
                    .filter(a -> a.getSchoolYear() != null && a.getSchoolYear().equals(classroom.getSchoolYear()))
                    .findFirst().orElse(null);

            return new ClassDTO.StudentSummary(
                    u.getUid(),
                    u.getName(),
                    info.getCode(),
                    assign != null ? assign.getAttendanceNum() : null,
                    "-",
                    info.getStatus().getDescription());
        }).collect(Collectors.toList());

        response.setStudents(studentSummaries);

        response.setHistories(LogHelper.getClassroomHistory(cid).stream().map(ClassDTO.HistoryResponse::from).toList());

        return response;
    }

    @Transactional(readOnly = true)
    public List<ClassDTO.TeacherSelectResponse> getTeacherListForDropdown() {
        log.info("[AdminClassService] getTeacherListForDropdown 호출됨");
        TeacherDTO.TeacherSearchCondition cond = new TeacherDTO.TeacherSearchCondition();
        cond.setStatus("EMPLOYED");

        try {
            List<ClassDTO.TeacherSelectResponse> list = teacherInfoRepository.search(cond, Pageable.unpaged())
                    .stream().map(ClassDTO.TeacherSelectResponse::from)
                    .collect(Collectors.toList());
            log.info("[AdminClassService] 교사 목록 변환 완료. 리스트 크기: {}", list.size());
            return list;
        } catch (Exception e) {
            log.error("[AdminClassService] 교사 목록 조회/변환 중 에러 발생", e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<ClassDTO.TeacherSelectResponse> getUnassignedTeachers(int year) {
        // 1. 전체 재직 교사 조회
        TeacherDTO.TeacherSearchCondition cond = new TeacherDTO.TeacherSearchCondition();
        cond.setStatus("EMPLOYED");
        List<User> allTeachers = teacherInfoRepository.search(cond, Pageable.unpaged()).getContent();

        // 2. 해당 학년도에 이미 배정된 교사 조회
        ClassDTO.SearchCondition classCond = new ClassDTO.SearchCondition();
        classCond.setYear(year);
        List<Classroom> classesInYear = classroomRepository.search(classCond, Pageable.unpaged()).getContent();

        Set<Long> assignedTeacherUids = classesInYear.stream()
                .filter(c -> c.getTeacher() != null)
                .map(c -> c.getTeacher().getUid())
                .collect(Collectors.toSet());

        return allTeachers.stream()
                .filter(t -> !assignedTeacherUids.contains(t.getUid()))
                .map(ClassDTO.TeacherSelectResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClassDTO.StudentSummary> getUnassignedStudents(int year, String keyword) {
        List<User> allUsers = userRepository.findAll();

        return allUsers.stream()
                .filter(u -> u.getInfo(StudentInfo.class) != null)
                .filter(u -> {
                    if (keyword == null || keyword.isBlank())
                        return true;
                    String k = keyword.trim();
                    StudentInfo info = u.getInfo(StudentInfo.class);
                    return u.getName().contains(k) || (info.getCode() != null && info.getCode().contains(k));
                })
                .filter(u -> {
                    StudentInfo info = u.getInfo(StudentInfo.class);
                    return info.getAssignments().stream()
                            .noneMatch(a -> a.getSchoolYear() != null && a.getSchoolYear().getYear() == year);
                })
                .map(u -> {
                    StudentInfo info = u.getInfo(StudentInfo.class);
                    return new ClassDTO.StudentSummary(
                            u.getUid(), u.getName(), info.getCode(), null, "-", info.getStatus().getDescription());
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClassDTO.TeacherSelectResponse> getAvailableTeachers(int year, Long currentCid) {
        TeacherDTO.TeacherSearchCondition cond = new TeacherDTO.TeacherSearchCondition();
        cond.setStatus("EMPLOYED");
        List<User> allTeachers = teacherInfoRepository.search(cond, Pageable.unpaged()).getContent();

        ClassDTO.SearchCondition classCond = new ClassDTO.SearchCondition();
        classCond.setYear(year);
        List<Classroom> classesInYear = classroomRepository.search(classCond, Pageable.unpaged()).getContent();

        Set<Long> assignedTeacherUids = classesInYear.stream()
                .filter(c -> c.getTeacher() != null && !c.getCid().equals(currentCid))
                .map(c -> c.getTeacher().getUid())
                .collect(Collectors.toSet());

        return allTeachers.stream()
                .filter(t -> !assignedTeacherUids.contains(t.getUid()))
                .map(ClassDTO.TeacherSelectResponse::from)
                .collect(Collectors.toList());
    }

    public Long createClass(ClassDTO.CreateRequest request) {
        log.info("[AdminClassService] createClass 호출됨");

        Long schoolId = SchoolContextHolder.getSchoolId();

        // 중복 확인 (같은 학교 내에서만 체크)
        boolean exists = schoolId != null
                ? classroomRepository.existsBySchoolYear_YearAndGradeAndClassNumAndSchool_Id(
                        request.getYear(), request.getGrade(), request.getClassNum(), schoolId)
                : classroomRepository.existsBySchoolYear_YearAndGradeAndClassNum(
                        request.getYear(), request.getGrade(), request.getClassNum());
        if (exists) {
            throw new IllegalArgumentException("이미 존재하는 학급입니다.");
        }

        Classroom classroom = new Classroom();
        classroom.setGrade(request.getGrade());
        classroom.setClassNum(request.getClassNum());

        if (schoolId != null) {
            School school = schoolRepository.findById(schoolId).orElse(null);
            if (school != null) {
                classroom.setSchool(school);
                SchoolYear schoolYear = findOrCreateSchoolYear(schoolId, request.getYear(), school);
                classroom.setSchoolYear(schoolYear);
            }
        }

        if (request.getTeacherUid() != null) {
            User teacher = userRepository.findById(request.getTeacherUid())
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            classroom.setTeacher(teacher);
            // [woo] homeroomTeacher(TeacherInfo)도 함께 설정
            teacherInfoRepository.findByUserUid(request.getTeacherUid())
                    .ifPresent(classroom::setHomeroomTeacher);
        }

        Long cid = classroomRepository.save(classroom).getCid();

        if (request.getStudentUids() != null && !request.getStudentUids().isEmpty()) {
            addStudents(cid, request.getStudentUids());
        }

        if (request.getRandomCount() != null && request.getRandomCount() > 0) {
            addRandomStudents(cid, request.getRandomCount());
        }

        logChange(cid, "CREATE",
                "학급 생성 (학년도: " + request.getYear() + ", " + request.getGrade() + "-" + request.getClassNum() + ")");

        // 담임 교사에게 학급 배정 알림
        if (request.getTeacherUid() != null) {
            User assignedTeacher = userRepository.findById(request.getTeacherUid()).orElse(null);
            if (assignedTeacher != null) {
                NotificationHelper.send(assignedTeacher, "담임 학급 배정",
                        request.getGrade() + "학년 " + request.getClassNum() + "반 담임으로 배정되었습니다.",
                        "/classroom");
            }
        }

        return cid;
    }

    public void updateClass(ClassDTO.UpdateRequest request) {
        Classroom classroom = classroomRepository.findById(request.getCid())
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        // 1. 학년/반 변경 시 중복 체크
        if (request.getGrade() != null && request.getClassNum() != null) {
            if (classroom.getGrade() != request.getGrade() || classroom.getClassNum() != request.getClassNum()) {
                Long schoolId = classroom.getSchool() != null ? classroom.getSchool().getId() : null;
                boolean exists = schoolId != null
                        ? classroomRepository.existsBySchoolYear_YearAndGradeAndClassNumAndSchool_Id(
                                classroom.getYear(), request.getGrade(), request.getClassNum(), schoolId)
                        : classroomRepository.existsBySchoolYear_YearAndGradeAndClassNum(
                                classroom.getYear(), request.getGrade(), request.getClassNum());
                if (exists) {
                    throw new IllegalArgumentException("이미 존재하는 학급(학년/반)입니다.");
                }
                classroom.setGrade(request.getGrade());
                classroom.setClassNum(request.getClassNum());
                logChange(classroom.getCid(), "UPDATE", "학년/반 변경: " + request.getGrade() + "-" + request.getClassNum());
            }
        }

        // 2. 상태 변경
        if (request.getStatus() != null) {
            classroom.setStatus(ClassroomStatus.valueOf(request.getStatus()));
        }

        // 3. 담임 교사 변경
        if (request.getTeacherUid() != null) {
            User teacher = userRepository.findById(request.getTeacherUid())
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            classroom.setTeacher(teacher);
            // [woo] homeroomTeacher(TeacherInfo)도 함께 설정
            teacherInfoRepository.findByUserUid(request.getTeacherUid())
                    .ifPresent(classroom::setHomeroomTeacher);
            logChange(classroom.getCid(), "UPDATE", "담임 교사 변경: " + teacher.getName());

            // 새 담임 교사에게 알림
            NotificationHelper.send(teacher, "담임 학급 배정",
                    classroom.getGrade() + "학년 " + classroom.getClassNum() + "반 담임으로 배정되었습니다.",
                    "/classroom");
        } else {
            classroom.setTeacher(null);
            classroom.setHomeroomTeacher(null);
            logChange(classroom.getCid(), "UPDATE", "담임 교사 해제");
        }
    }

    public void addStudents(Long cid, List<Long> studentUids) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        List<User> users = userRepository.findAllById(studentUids);

        int maxNum = studentInfoRepository.findMaxAttendanceNum(classroom.getYear(), classroom.getGrade(),
                classroom.getClassNum());
        int nextNum = maxNum + 1;

        for (User user : users) {
            StudentInfo info = user.getInfo(StudentInfo.class);

            StudentAssignment assignment = info.getAssignments().stream()
                    .filter(a -> a.getSchoolYear() != null && a.getSchoolYear().equals(classroom.getSchoolYear()))
                    .findFirst().orElse(null);

            if (assignment != null) {
                if (assignment.getClassroom().getCid().equals(classroom.getCid())) {
                    continue;
                }
                assignment.setClassroom(classroom);
                assignment.setAttendanceNum(nextNum++);
            } else {
                StudentAssignment newAssignment = new StudentAssignment();
                newAssignment.setStudentInfo(info);
                newAssignment.setSchoolYear(classroom.getSchoolYear());
                newAssignment.setClassroom(classroom);
                newAssignment.setAttendanceNum(nextNum++);
                info.getAssignments().add(newAssignment);
            }
        }

        logChange(cid, "ASSIGN_STUDENT", users.size() + "명 학생 배정");

        // 배정된 학생들에게 학급 배정 알림
        String className = classroom.getGrade() + "학년 " + classroom.getClassNum() + "반";
        for (User user : users) {
            NotificationHelper.send(user, "학급 배정 안내",
                    className + "에 배정되었습니다.", "/classroom");
        }
    }

    public String assignStudents(Long cid, List<Long> studentUids, int randomCount) {
        int manualCount = 0;
        if (studentUids != null && !studentUids.isEmpty()) {
            addStudents(cid, studentUids);
            manualCount = studentUids.size();
        }

        int randomAdded = 0;
        if (randomCount > 0) {
            randomAdded = addRandomStudents(cid, randomCount);
        }

        if (manualCount == 0 && randomAdded == 0 && randomCount > 0) {
            return "배정 가능한 미배정 학생이 없습니다.";
        }
        return String.format("학생 배정 완료 (수동: %d명, 랜덤: %d명)", manualCount, randomAdded);
    }

    public int addRandomStudents(Long cid, int count) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        List<User> randomStudents = studentInfoRepository.findUnassignedStudents(classroom.getYear(), count);
        if (randomStudents.isEmpty()) {
            return 0;
        }

        addStudents(cid, randomStudents.stream().map(User::getUid).toList());
        return randomStudents.size();
    }

    public void removeStudent(Long cid, Long studentUid) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        User user = userRepository.findById(studentUid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        StudentInfo info = user.getInfo(StudentInfo.class);

        info.getAssignments().removeIf(a -> a.getClassroom().getCid().equals(classroom.getCid()));

        logChange(cid, "REMOVE_STUDENT", "학생 제외: " + user.getName());

        // 학생에게 학급 제외 알림
        NotificationHelper.send(user, "학급 변경 안내",
                classroom.getGrade() + "학년 " + classroom.getClassNum() + "반에서 제외되었습니다.");
    }

    public void removeStudents(Long cid, List<Long> studentUids) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        List<User> users = userRepository.findAllById(studentUids);

        for (User user : users) {
            StudentInfo info = user.getInfo(StudentInfo.class);
            info.getAssignments().removeIf(a -> a.getClassroom().getCid().equals(classroom.getCid()));
        }

        logChange(cid, "REMOVE_STUDENT", users.size() + "명 학생 일괄 제외");
    }

    public void transferStudent(Long currentCid, Long targetCid, Long studentUid) {
        Classroom targetClassroom = classroomRepository.findById(targetCid)
                .orElseThrow(() -> new IllegalArgumentException("이동할 학급 정보를 찾을 수 없습니다."));

        User user = userRepository.findById(studentUid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        StudentInfo info = user.getInfo(StudentInfo.class);

        StudentAssignment assignment = info.getAssignments().stream()
                .filter(a -> a.getClassroom().getCid().equals(currentCid))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 학급에 학생이 배정되어 있지 않습니다."));

        int nextNum = studentInfoRepository.findMaxAttendanceNum(targetClassroom.getYear(), targetClassroom.getGrade(),
                targetClassroom.getClassNum()) + 1;

        assignment.setClassroom(targetClassroom);
        assignment.setAttendanceNum(nextNum);

        logChange(currentCid, "TRANSFER_OUT", "학생 전출: " + user.getName() + " -> " + targetClassroom.getClassName());
        logChange(targetCid, "TRANSFER_IN", "학생 전입: " + user.getName() + " (from " + currentCid + ")");

        // 학생에게 반 이동 알림
        NotificationHelper.send(user, "학급 이동 안내",
                targetClassroom.getClassName() + "(으)로 이동되었습니다.", "/classroom");
    }

    public void bulkUpdateClassStatus(List<Long> cids, String statusName) {
        ClassroomStatus status = ClassroomStatus.valueOf(statusName);
        List<Classroom> classrooms = classroomRepository.findAllById(cids);
        for (Classroom classroom : classrooms) {
            classroom.setStatus(status);
            logChange(classroom.getCid(), "UPDATE", "상태 변경: " + status.getDescription());
        }
    }

    // --- CSV Import ---
    public String importClassesFromCsv(MultipartFile file) throws Exception {
        List<String> skippedStudentCodes = new ArrayList<>();
        int successClassCount = 0;

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            List<ClassDTO.CsvImportRequest> beans = new CsvToBeanBuilder<ClassDTO.CsvImportRequest>(reader)
                    .withType(ClassDTO.CsvImportRequest.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build().parse();

            Long schoolId = SchoolContextHolder.getSchoolId();

            for (ClassDTO.CsvImportRequest req : beans) {
                Classroom classroom = (schoolId != null)
                        ? classroomRepository.findBySchoolIdAndSchoolYear_YearAndGradeAndClassNum(
                                schoolId, req.getYear(), req.getGrade(), req.getClassNum()).orElse(null)
                        : classroomRepository.findBySchoolYear_YearAndGradeAndClassNum(
                                req.getYear(), req.getGrade(), req.getClassNum()).orElse(null);

                if (classroom == null) {
                    classroom = new Classroom();
                    classroom.setGrade(req.getGrade());
                    classroom.setClassNum(req.getClassNum());

                    if (schoolId != null) {
                        School school = schoolRepository.findById(schoolId).orElse(null);
                        if (school != null) {
                            classroom.setSchool(school);
                            SchoolYear schoolYear = findOrCreateSchoolYear(schoolId, req.getYear(), school);
                            classroom.setSchoolYear(schoolYear);
                        }
                    }

                    classroom = classroomRepository.save(classroom);
                    logChange(classroom.getCid(), "CREATE", "CSV 일괄 생성");
                }
                successClassCount++;

                if (req.getTeacherCode() != null && !req.getTeacherCode().isBlank()) {
                    User teacher = teacherInfoRepository.findTeacherByCode(req.getTeacherCode()).orElse(null);
                    if (teacher != null) {
                        classroom.setTeacher(teacher);
                    } else {
                        log.warn("CSV Import: 존재하지 않는 교사 사번 건너뜀 - {}", req.getTeacherCode());
                    }
                }

                if (req.getStudentCodes() != null && !req.getStudentCodes().isBlank()) {
                    String[] codes = req.getStudentCodes().split(",");
                    for (String code : codes) {
                        String trimmedCode = code.trim();
                        if (trimmedCode.isEmpty())
                            continue;

                        User student = studentInfoRepository.findDetailByCode(trimmedCode).orElse(null);
                        if (student != null) {
                            addStudents(classroom.getCid(), List.of(student.getUid()));
                        } else {
                            skippedStudentCodes.add(trimmedCode);
                            log.warn("CSV Import: 존재하지 않는 학생 학번 건너뜀 - {}", trimmedCode);
                        }
                    }
                }
            }
        }

        StringBuilder resultMsg = new StringBuilder();
        resultMsg.append("학급 일괄 생성이 완료되었습니다. (처리된 학급: ").append(successClassCount).append("건)");
        if (!skippedStudentCodes.isEmpty()) {
            resultMsg.append("\n[주의] 존재하지 않는 학번이 제외되었습니다 (").append(skippedStudentCodes.size()).append("명): ");
            resultMsg.append(String.join(", ", skippedStudentCodes));
        }
        return resultMsg.toString();
    }

    // --- History Log ---
    private void logChange(Long cid, String action, String desc) {
        String adminName = SecurityContextHolder.getContext().getAuthentication().getName();
        LogHelper.classroom(cid, adminName, action, desc);
    }

    // --- Roster Export ---
    public String generateRosterCsv(Long cid) {
        ClassDTO.DetailResponse detail = getClassDetail(cid);
        StringBuilder sb = new StringBuilder();
        sb.append("번호,이름,학번,상태\n");

        List<ClassDTO.StudentSummary> sortedStudents = detail.getStudents().stream()
                .sorted((s1, s2) -> {
                    if (s1.getAttendanceNum() != null && s2.getAttendanceNum() != null) {
                        return s1.getAttendanceNum().compareTo(s2.getAttendanceNum());
                    }
                    return s1.getName().compareTo(s2.getName());
                })
                .toList();

        for (ClassDTO.StudentSummary s : sortedStudents) {
            sb.append(s.getAttendanceNum() != null ? s.getAttendanceNum() : "-").append(",")
                    .append(s.getName()).append(",")
                    .append(s.getCode()).append(",")
                    .append(s.getStatus()).append("\n");
        }
        return sb.toString();
    }

    public void deleteClass(Long cid) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        if (classroom.getTeacher() != null) {
            throw new IllegalStateException("담임 교사가 배정된 학급은 삭제할 수 없습니다. 먼저 교사 배정을 해제하세요.");
        }

        long studentCount = studentInfoRepository.countByClassroom(classroom.getYear(), classroom.getGrade(),
                classroom.getClassNum());
        if (studentCount > 0) {
            throw new IllegalStateException("학생이 배정된 학급은 삭제할 수 없습니다. 먼저 학생들을 제외하세요.");
        }

        classroomRepository.delete(classroom);
    }

    // 우님 작업물
    @Transactional(readOnly = true)
    public List<ClassDTO.DetailResponse> getClassList() {
        return classroomRepository.findAll().stream()
                .map(c -> ClassDTO.DetailResponse.from(c, 0))
                .collect(Collectors.toList());
    }

    // 우님 작업물
    @Transactional(readOnly = true)
    public List<ClassDTO.TeacherSelectResponse> getTeacherList() {
        TeacherDTO.TeacherSearchCondition cond = new TeacherDTO.TeacherSearchCondition();
        cond.setStatus("EMPLOYED");
        return teacherInfoRepository.search(cond, Pageable.unpaged()).stream()
                .map(ClassDTO.TeacherSelectResponse::from)
                .collect(Collectors.toList());
    }

    // 우님 작업물
    public void assignTeacher(ClassDTO.UpdateRequest request) {
        Classroom classroom = classroomRepository.findById(request.getCid())
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        if (request.getTeacherUid() != null) {
            User teacher = userRepository.findById(request.getTeacherUid())
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            classroom.setTeacher(teacher);

            // 담임 교사에게 알림
            NotificationHelper.send(teacher, "담임 학급 배정",
                    classroom.getGrade() + "학년 " + classroom.getClassNum() + "반 담임으로 배정되었습니다.",
                    "/classroom");
        } else {
            classroom.setTeacher(null);
        }
    }

    // ── 내부 유틸 ────────────────────────────────────────────────────────────

    /** 학교별 학년도 엔티티 조회 또는 생성 (PAST 상태로 생성 - 현재 학년도 전환은 AcademicTermService가 담당) */
    private SchoolYear findOrCreateSchoolYear(Long schoolId, int year, School school) {
        return schoolYearRepository.findBySchoolIdAndYear(schoolId, year)
                .orElseGet(() -> {
                    SchoolYearStatus status = (java.time.LocalDate.now().getYear() == year) ? SchoolYearStatus.CURRENT : SchoolYearStatus.PAST;
                    SchoolYear sy = new SchoolYear(year, status);
                    sy.setSchool(school);
                    return schoolYearRepository.save(sy);
                });
    }
}
