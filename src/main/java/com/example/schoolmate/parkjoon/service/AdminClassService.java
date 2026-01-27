package com.example.schoolmate.parkjoon.service;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.common.entity.log.ClassroomHistory;
import com.opencsv.bean.CsvToBeanBuilder;

import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.constant.ClassroomStatus;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.ClassroomHistoryRepository;
import com.example.schoolmate.common.repository.ClassroomRepository;
import com.example.schoolmate.common.repository.UserRepository;

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
public class AdminClassService {

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final ClassroomHistoryRepository classroomHistoryRepository;

    @Transactional(readOnly = true)
    public Page<ClassDTO.DetailResponse> getClassList(ClassDTO.SearchCondition cond, Pageable pageable) {
        return classroomRepository.search(cond, pageable)
                .map(c -> {
                    long count = userRepository.countByClassroom(c.getYear(), c.getGrade(), c.getClassNum());
                    return ClassDTO.DetailResponse.from(c, (int) count);
                });
    }

    @Transactional(readOnly = true)
    public ClassDTO.DetailResponse getClassDetail(Long cid) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        // 해당 학급(학년도, 학년, 반)에 배정된 학생 조회
        // StudentAssignmentRepository 등을 통해 조회하거나 UserRepositoryCustom 사용
        // 여기서는 로직 설명을 위해 의사 코드로 작성 (실제 구현 시 Repository 메서드 필요)
        List<User> students = userRepository.findStudentsByAssignment(
                classroom.getYear(), classroom.getGrade(), classroom.getClassNum());

        ClassDTO.DetailResponse response = ClassDTO.DetailResponse.from(classroom, students.size());

        List<ClassDTO.StudentSummary> studentSummaries = students.stream().map(u -> {
            StudentInfo info = u.getInfo(StudentInfo.class);
            StudentAssignment assign = info.getAssignments().stream()
                    .filter(a -> a.getSchoolYear() == classroom.getYear())
                    .findFirst().orElse(null);

            return new ClassDTO.StudentSummary(
                    u.getUid(),
                    u.getName(),
                    info.getCode(),
                    assign != null ? assign.getStudentNum() : null,
                    "-", // 성별 정보 없음
                    info.getStatus().getDescription());
        }).collect(Collectors.toList());

        response.setStudents(studentSummaries);

        // 이력 조회
        List<ClassroomHistory> histories = classroomHistoryRepository.findByClassroomIdOrderByCreatedAtDesc(cid);
        response.setHistories(histories.stream().map(ClassDTO.HistoryResponse::from).toList());

        return response;
    }

    @Transactional(readOnly = true)
    public List<ClassDTO.TeacherSelectResponse> getTeacherListForDropdown() {
        log.info("[AdminClassService] getTeacherListForDropdown 호출됨");
        TeacherDTO.TeacherSearchCondition cond = new TeacherDTO.TeacherSearchCondition();
        cond.setStatus("EMPLOYED");

        try {
            List<ClassDTO.TeacherSelectResponse> list = userRepository.searchTeachers(cond, Pageable.unpaged())
                    .stream().map(ClassDTO.TeacherSelectResponse::from)
                    .collect(Collectors.toList());
            log.info("[AdminClassService] 교사 목록 변환 완료. 리스트 크기: {}", list.size());
            return list;
        } catch (Exception e) {
            log.error("[AdminClassService] 교사 목록 조회/변환 중 에러 발생", e);
            throw e;
        }
    }

    public Long createClass(ClassDTO.CreateRequest request) {
        log.info("[AdminClassService] createClass 호출됨");
        // 중복 확인
        boolean exists = classroomRepository.existsByYearAndGradeAndClassNum(
                request.getYear(), request.getGrade(), request.getClassNum());
        if (exists) {
            throw new IllegalArgumentException("이미 존재하는 학급입니다.");
        }

        Classroom classroom = new Classroom();
        classroom.setYear(request.getYear());
        classroom.setGrade(request.getGrade());
        classroom.setClassNum(request.getClassNum());

        if (request.getTeacherUid() != null) {
            User teacher = userRepository.findById(request.getTeacherUid())
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            classroom.setTeacher(teacher);
        }

        Long cid = classroomRepository.save(classroom).getCid();

        // 1. 수동 선택 학생 배정
        if (request.getStudentUids() != null && !request.getStudentUids().isEmpty()) {
            addStudents(cid, request.getStudentUids());
        }

        // 2. 랜덤 학생 배정
        if (request.getRandomCount() != null && request.getRandomCount() > 0) {
            List<User> randomStudents = userRepository.findUnassignedStudents(request.getYear(),
                    request.getRandomCount());
            addStudents(cid, randomStudents.stream().map(User::getUid).toList());
        }

        logChange(cid, "CREATE",
                "학급 생성 (학년도: " + request.getYear() + ", " + request.getGrade() + "-" + request.getClassNum() + ")");

        return cid;
    }

    public void updateClass(ClassDTO.UpdateRequest request) {
        Classroom classroom = classroomRepository.findById(request.getCid())
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        // 1. 학년/반 변경 시 중복 체크
        if (request.getGrade() != null && request.getClassNum() != null) {
            if (classroom.getGrade() != request.getGrade() || classroom.getClassNum() != request.getClassNum()) {
                boolean exists = classroomRepository.existsByYearAndGradeAndClassNum(
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
            logChange(classroom.getCid(), "UPDATE", "담임 교사 변경: " + teacher.getName());
        } else {
            classroom.setTeacher(null);
            logChange(classroom.getCid(), "UPDATE", "담임 교사 해제");
        }
    }

    public void addStudents(Long cid, List<Long> studentUids) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        List<User> users = userRepository.findAllById(studentUids);

        // 현재 학급의 가장 마지막 번호 조회 (자동 번호 부여용)
        // int maxNum = ...;
        int nextNum = 1; // 임시

        for (User user : users) {
            StudentInfo info = user.getInfo(StudentInfo.class);

            // 이미 해당 학년도에 배정된 정보가 있는지 확인
            boolean assigned = info.getAssignments().stream()
                    .anyMatch(a -> a.getSchoolYear() == classroom.getYear());

            if (assigned) {
                // 이미 배정된 경우: 전반(Transfer) 처리 또는 예외 발생
                // 여기서는 기존 배정을 업데이트하는 방식으로 구현
                StudentAssignment assignment = info.getAssignments().stream()
                        .filter(a -> a.getSchoolYear() == classroom.getYear())
                        .findFirst().get();
                assignment.setGrade(classroom.getGrade());
                assignment.setClassNum(classroom.getClassNum());
                // 번호는 유지하거나 재할당
            } else {
                // 신규 배정
                StudentAssignment assignment = new StudentAssignment();
                assignment.setStudentInfo(info);
                assignment.setSchoolYear(classroom.getYear());
                assignment.setGrade(classroom.getGrade());
                assignment.setClassNum(classroom.getClassNum());
                assignment.setStudentNum(nextNum++); // 임시 번호
                info.getAssignments().add(assignment);
            }
        }

        logChange(cid, "ASSIGN_STUDENT", users.size() + "명 학생 배정");
    }

    public void removeStudent(Long cid, Long studentUid) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        User user = userRepository.findById(studentUid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        StudentInfo info = user.getInfo(StudentInfo.class);

        // 해당 학년도의 배정 정보 삭제
        info.getAssignments().removeIf(a -> a.getSchoolYear() == classroom.getYear() &&
                a.getGrade() == classroom.getGrade() &&
                a.getClassNum() == classroom.getClassNum());

        logChange(cid, "REMOVE_STUDENT", "학생 제외: " + user.getName());
    }

    public void removeStudents(Long cid, List<Long> studentUids) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        List<User> users = userRepository.findAllById(studentUids);

        for (User user : users) {
            StudentInfo info = user.getInfo(StudentInfo.class);
            // 해당 학년도의 배정 정보 삭제
            info.getAssignments().removeIf(a -> a.getSchoolYear() == classroom.getYear() &&
                    a.getGrade() == classroom.getGrade() &&
                    a.getClassNum() == classroom.getClassNum());
        }

        logChange(cid, "REMOVE_STUDENT", users.size() + "명 학생 일괄 제외");
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

            for (ClassDTO.CsvImportRequest req : beans) {
                // 1. 학급 조회 또는 생성
                Classroom classroom = classroomRepository.findAll().stream()
                        .filter(c -> c.getYear() == req.getYear() && c.getGrade() == req.getGrade()
                                && c.getClassNum() == req.getClassNum())
                        .findFirst().orElse(null);

                if (classroom == null) {
                    classroom = new Classroom();
                    classroom.setYear(req.getYear());
                    classroom.setGrade(req.getGrade());
                    classroom.setClassNum(req.getClassNum());
                    classroom = classroomRepository.save(classroom);
                    logChange(classroom.getCid(), "CREATE", "CSV 일괄 생성");
                }
                successClassCount++;

                // 2. 담임 교사 배정
                if (req.getTeacherCode() != null && !req.getTeacherCode().isBlank()) {
                    User teacher = userRepository.findTeacherByCode(req.getTeacherCode())
                            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 교사 사번: " + req.getTeacherCode()));
                    classroom.setTeacher(teacher);
                }

                // 3. 학생 배정
                if (req.getStudentCodes() != null && !req.getStudentCodes().isBlank()) {
                    String[] codes = req.getStudentCodes().split(",");
                    for (String code : codes) {
                        String trimmedCode = code.trim();
                        if (trimmedCode.isEmpty())
                            continue;

                        User student = userRepository.findDetailByCode(trimmedCode).orElse(null);
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
        ClassroomHistory history = ClassroomHistory.builder()
                .classroomId(cid)
                .actionType(action)
                .description(desc)
                .createdBy(adminName)
                .build();
        classroomHistoryRepository.save(history);
    }

    // --- Roster Export ---
    public String generateRosterCsv(Long cid) {
        ClassDTO.DetailResponse detail = getClassDetail(cid);
        StringBuilder sb = new StringBuilder();
        sb.append("번호,이름,학번,상태\n");

        // 번호순 정렬 (번호가 없으면 이름순)
        List<ClassDTO.StudentSummary> sortedStudents = detail.getStudents().stream()
                .sorted((s1, s2) -> {
                    if (s1.getStudentNum() != null && s2.getStudentNum() != null) {
                        return s1.getStudentNum().compareTo(s2.getStudentNum());
                    }
                    return s1.getName().compareTo(s2.getName());
                })
                .toList();

        for (ClassDTO.StudentSummary s : sortedStudents) {
            sb.append(s.getStudentNum() != null ? s.getStudentNum() : "-").append(",")
                    .append(s.getName()).append(",")
                    .append(s.getCode()).append(",")
                    .append(s.getStatus()).append("\n");
        }
        return sb.toString();
    }

    public void deleteClass(Long cid) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        // 1. 교사 배정 확인
        if (classroom.getTeacher() != null) {
            throw new IllegalStateException("담임 교사가 배정된 학급은 삭제할 수 없습니다. 먼저 교사 배정을 해제하세요.");
        }

        // 2. 학생 배정 확인
        long studentCount = userRepository.countByClassroom(classroom.getYear(), classroom.getGrade(),
                classroom.getClassNum());
        if (studentCount > 0) {
            throw new IllegalStateException("학생이 배정된 학급은 삭제할 수 없습니다. 먼저 학생들을 제외하세요.");
        }

        classroomRepository.delete(classroom);
    }
}