package com.example.schoolmate.common.service;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.cheol.dto.GradeDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.GradeRepository;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.dto.NotificationDTO;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.repository.notice.NotificationRepository;
import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherResponseDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherUpdateDTO;
import com.opencsv.bean.CsvToBeanBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 교사 통합 서비스
 * - 관리자용 교사 관리 (CRUD, CSV 일괄 등록, 권한 관리)
 * - 교사 전용 기능 (담당 학급 조회, 학생 관리, 성적 입력)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class TeacherService {

    private final TeacherInfoRepository teacherInfoRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final ClassroomRepository classroomRepository;
    private final GradeRepository gradeRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationRepository notificationRepository;

    // ==================================================================================
    // ========== [관리자] 교사 관리 ==========
    // ==================================================================================

    /**
     * 교사 목록 조회 (검색 조건 포함)
     */
    public Page<TeacherDTO.DetailResponse> getTeacherList(TeacherDTO.TeacherSearchCondition cond, Pageable pageable) {
        Page<User> userPage = teacherInfoRepository.search(cond, pageable);
        return userPage.map(TeacherDTO.DetailResponse::new);
    }

    /**
     * 교사 상세 정보 조회
     */
    public TeacherDTO.DetailResponse getTeacherDetail(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 교사입니다."));

        TeacherDTO.DetailResponse response = new TeacherDTO.DetailResponse(user);

        List<Notification> notifications = notificationRepository.findByReceiverOrderByCreateDateDesc(user);
        response.setNotifications(notifications.stream()
                .map(NotificationDTO.NotificationHistory::new)
                .toList());

        return response;
    }

    /**
     * 교사 신규 등록
     */
    @Transactional
    public void createTeacher(TeacherDTO.CreateRequest request) {
        if (request.getCode() != null && teacherInfoRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 사번입니다: " + request.getCode());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Set.of(UserRole.TEACHER)))
                .build();

        TeacherInfo info = new TeacherInfo();
        info.setCode(request.getCode());
        info.setSubject(request.getSubject());
        info.setDepartment(request.getDepartment());
        info.setPosition(request.getPosition());
        info.setStatus(TeacherStatus.EMPLOYED);
        info.setUser(user);

        user.getInfos().add(info);
        userRepository.save(user);
    }

    /**
     * 교사 정보 수정 (관리자용 - UpdateRequest)
     */
    @Transactional
    public void updateTeacher(TeacherDTO.UpdateRequest request) {
        User user = userRepository.findById(request.getUid())
                .orElseThrow(() -> new IllegalArgumentException("Invalid user Id:" + request.getUid()));

        user.setName(request.getName());

        TeacherInfo info = user.getInfo(TeacherInfo.class);
        if (info != null && request.getStatusName() != null) {
            if (request.getCode() != null && !request.getCode().equals(info.getCode())) {
                if (teacherInfoRepository.existsByCode(request.getCode())) {
                    throw new IllegalArgumentException("이미 존재하는 사번입니다: " + request.getCode());
                }
                info.setCode(request.getCode());
            }
            TeacherStatus newStatus = TeacherStatus.valueOf(request.getStatusName());
            info.update(request.getSubject(), request.getDepartment(), request.getPosition(), newStatus);
        }
    }

    /**
     * CSV 파일 일괄 교사 등록
     */
    @Transactional
    public void importTeachersFromCsv(MultipartFile file) throws Exception {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            log.info("CSV 파일 읽기 시작: {}", file.getOriginalFilename());
            List<TeacherDTO.CsvImportRequest> beans = new CsvToBeanBuilder<TeacherDTO.CsvImportRequest>(reader)
                    .withType(TeacherDTO.CsvImportRequest.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();
            log.info("파싱된 데이터 개수: {}", beans.size());
            for (TeacherDTO.CsvImportRequest csvReq : beans) {
                try {
                    if (userRepository.existsByEmail(csvReq.getEmail())) {
                        log.warn("이미 존재하는 이메일 건너뜀: {}", csvReq.getEmail());
                        continue;
                    }
                    if (teacherInfoRepository.existsByCode(csvReq.getCode())) {
                        log.warn("이미 존재하는 사번 건너뜀: {}", csvReq.getCode());
                        continue;
                    }
                    this.createTeacher(new TeacherDTO.CreateRequest(csvReq));
                    log.info("교사 등록 성공: {}", csvReq.getEmail());
                } catch (Exception e) {
                    log.error("교사 등록 중 상세 에러 ({}) : {}", csvReq.getEmail(), e.getMessage());
                    throw e;
                }
            }
        } catch (Exception e) {
            log.error("CSV 파싱 또는 처리 중 치명적 에러: ", e);
            throw e;
        }
    }

    /**
     * 교사 상태 일괄 변경
     */
    @Transactional
    public void bulkUpdateTeacherStatus(List<Long> uids, String statusName) {
        TeacherStatus status = TeacherStatus.valueOf(statusName);
        List<User> users = userRepository.findAllById(uids);
        for (User user : users) {
            TeacherInfo info = user.getInfo(TeacherInfo.class);
            if (info != null)
                info.setStatus(status);
        }
    }

    /**
     * 교사 권한 추가
     */
    @Transactional
    public void addRole(Long uid, String roleName) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        user.getRoles().add(UserRole.valueOf(roleName));
    }

    /**
     * 교사 권한 삭제
     */
    @Transactional
    public void removeRole(Long uid, String roleName) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        user.getRoles().remove(UserRole.valueOf(roleName));
    }

    // ==================================================================================
    // ========== [교사] 교사 정보 관리 ==========
    // ==================================================================================

    /**
     * 교사 정보 단건 조회 (woo dto 반환)
     */
    public TeacherResponseDTO getTeacherById(Long id) {
        TeacherInfo teacher = teacherInfoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + id));
        return new TeacherResponseDTO(teacher);
    }

    /**
     * 전체 교사 목록 조회 (woo dto 반환)
     */
    public List<TeacherResponseDTO> getAllTeachers() {
        return teacherInfoRepository.findAll().stream()
                .map(TeacherResponseDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * 교사 정보 수정 (교사용 - TeacherUpdateDTO)
     */
    @Transactional
    public TeacherResponseDTO updateTeacher(Long id, TeacherUpdateDTO updateDTO) {
        TeacherInfo teacher = teacherInfoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + id));

        if (updateDTO.getSubject() != null) {
            teacher.setSubject(updateDTO.getSubject());
        }
        if (updateDTO.getDepartment() != null) {
            teacher.setDepartment(updateDTO.getDepartment());
        }
        if (updateDTO.getPosition() != null) {
            teacher.setPosition(updateDTO.getPosition());
        }
        if (updateDTO.getStatus() != null) {
            teacher.setStatus(updateDTO.getStatus());
        }

        return new TeacherResponseDTO(teacher);
    }

    // ==================================================================================
    // ========== [교사] 학생 CRUD ==========
    // ==================================================================================

    /**
     * 학생 등록 (classroomId 직접 지정)
     */
    @Transactional
    public StudentResponseDTO createStudent(StudentCreateDTO createDTO) {
        log.info("학생 등록: {}", createDTO.getStudentNumber());

        if (studentInfoRepository.findByAttendanceNum(createDTO.getStudentNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 학번입니다: " + createDTO.getStudentNumber());
        }

        Classroom classroom = classroomRepository.findById(createDTO.getClassroomId())
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + createDTO.getClassroomId()));

        StudentInfo student = new StudentInfo();
        StudentAssignment assignment = new StudentAssignment();
        assignment.setAttendanceNum(createDTO.getStudentNumber());
        assignment.setClassroom(classroom);
        assignment.setStudentInfo(student);
        student.getAssignments().add(assignment);
        student.setCurrentAssignment(assignment);
        student.setBirthDate(createDTO.getBirthDate());
        student.setAddress(createDTO.getAddress());
        student.setPhone(createDTO.getPhone());
        student.setGender(createDTO.getGender());

        StudentInfo savedStudent = studentInfoRepository.save(student);
        return StudentResponseDTO.from(savedStudent);
    }

    /**
     * 학생 단건 조회
     */
    public StudentResponseDTO getStudentById(Long studentId) {
        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));
        return StudentResponseDTO.from(student);
    }

    /**
     * 전체 학생 목록 조회
     */
    public List<StudentResponseDTO> getAllStudents() {
        return studentInfoRepository.findAll().stream()
                .map(StudentResponseDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * 학생 정보 수정
     */
    @Transactional
    public StudentResponseDTO updateStudent(Long studentId, StudentUpdateDTO updateDTO) {
        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        if (updateDTO.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(updateDTO.getClassroomId())
                    .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + updateDTO.getClassroomId()));
            if (student.getCurrentAssignment() != null) {
                student.getCurrentAssignment().setClassroom(classroom);
            }
        }
        if (updateDTO.getBirthDate() != null) {
            student.setBirthDate(updateDTO.getBirthDate());
        }
        if (updateDTO.getAddress() != null) {
            student.setAddress(updateDTO.getAddress());
        }
        if (updateDTO.getPhone() != null) {
            student.setPhone(updateDTO.getPhone());
        }
        if (updateDTO.getGender() != null) {
            student.setGender(updateDTO.getGender());
        }

        return StudentResponseDTO.from(student);
    }

    /**
     * 학생 삭제 (소프트 삭제 - 자퇴 처리)
     */
    @Transactional
    public void deleteStudent(Long studentId) {
        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        student.setStatus(StudentStatus.DROPOUT);
        log.info("학생 삭제(자퇴) 처리: {}", studentId);
    }

    // ==================================================================================
    // ========== [교사] 담당 학급 조회 ==========
    // ==================================================================================

    /**
     * 내 담임 학급 학생 조회
     */
    public ClassStudentDTO getMyClassStudents(Long teacherId, int schoolYear) {
        log.info("담당 반 학생 조회 - 교사 ID: {}, 학년도: {}", teacherId, schoolYear);
        Long userUid = getUserUidFromTeacherId(teacherId);
        Classroom classroom = classroomRepository.findByTeacherUidAndYear(userUid, schoolYear)
                .orElseThrow(() -> new IllegalArgumentException("담당 학급이 없습니다."));
        return buildClassStudentDTO(classroom);
    }

    /**
     * 특정 학급 학생 조회 (학년도/학년/반)
     */
    public ClassStudentDTO getClassStudents(int schoolYear, int grade, int classNum) {
        log.info("학급 학생 조회 - {}학년도 {}학년 {}반", schoolYear, grade, classNum);
        Classroom classroom = classroomRepository.findByYearAndGradeAndClassNum(schoolYear, grade, classNum)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));
        return buildClassStudentDTO(classroom);
    }

    // ==================================================================================
    // ========== [교사] 성적 관리 ==========
    // ==================================================================================

    /**
     * 성적 입력
     */
    @Transactional
    public void inputGrade(Long teacherId, GradeInputDTO gradeDTO) {
        log.info("성적 입력 - 교사: {}, 학생: {}, 과목: {}",
                teacherId, gradeDTO.getStudentId(), gradeDTO.getSubjectCode());

        TeacherInfo teacher = teacherInfoRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));

        Subject subject = subjectRepository.findByCode(gradeDTO.getSubjectCode())
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다: " + gradeDTO.getSubjectCode()));

        if (subject.getTeacher() != null && !subject.getTeacher().getId().equals(teacherId)) {
            log.warn("담당 과목이 아닙니다. 교사: {}, 과목 담당: {}", teacherId, subject.getTeacher().getId());
        }

        StudentInfo student = studentInfoRepository.findById(gradeDTO.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        Grade grade = Grade.builder()
                .student(student)
                .subject(subject)
                .testType(gradeDTO.getTestType())
                .semester(gradeDTO.getSemester())
                .year(gradeDTO.getYear())
                .score(gradeDTO.getScore())
                .build();

        gradeRepository.save(grade);
        log.info("성적 입력 완료 - 학생: {}, 과목: {}, 점수: {}",
                student.getId(), subject.getName(), gradeDTO.getScore());
    }

    /**
     * 성적 수정
     */
    @Transactional
    public void updateGrade(Long teacherId, Long gradeId, Double newScore) {
        log.info("성적 수정 - 교사: {}, 성적ID: {}, 새점수: {}", teacherId, gradeId, newScore);
        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new IllegalArgumentException("성적을 찾을 수 없습니다."));
        grade.changeScore(newScore);
    }

    /**
     * 과목별 성적 조회
     */
    public List<GradeDTO> getMySubjectGrades(Long teacherId, String subjectCode) {
        log.info("과목 성적 조회 - 교사: {}, 과목: {}", teacherId, subjectCode);
        List<Grade> grades = gradeRepository.findBySubjectCodeWithSubject(subjectCode);
        return grades.stream().map(this::entityToDto).collect(Collectors.toList());
    }

    /**
     * 학생별 성적 조회
     */
    public List<GradeDTO> getStudentGrades(Long studentId) {
        log.info("학생 성적 조회 - 학생 ID: {}", studentId);
        List<Grade> grades = gradeRepository.findByStudentIdWithSubject(studentId);
        return grades.stream().map(this::entityToDto).collect(Collectors.toList());
    }

    // ==================================================================================
    // ========== [교사] 담임 배정 확인 및 담당 학급 관리 ==========
    // ==================================================================================

    /**
     * 담임 배정 여부 확인
     */
    public boolean isHomeroom(Long teacherId, int schoolYear) {
        Long userUid = getUserUidFromTeacherId(teacherId);
        return classroomRepository.findByTeacherUidAndYear(userUid, schoolYear).isPresent();
    }

    /**
     * 내 담임 학급 정보 조회 (Optional)
     */
    public Optional<Classroom> getMyClassroom(Long teacherId, int schoolYear) {
        Long userUid = getUserUidFromTeacherId(teacherId);
        return classroomRepository.findByTeacherUidAndYear(userUid, schoolYear);
    }

    /**
     * 내 담임 학급 정보 조회 (예외 발생 버전)
     */
    public Classroom getMyClassroomOrThrow(Long teacherId, int schoolYear) {
        Long userUid = getUserUidFromTeacherId(teacherId);
        return classroomRepository.findByTeacherUidAndYear(userUid, schoolYear)
                .orElseThrow(() -> new IllegalArgumentException("담당 학급이 없습니다. 관리자에게 담임 배정을 요청하세요."));
    }

    /**
     * 담당 학급에 학생 등록 (담임 전용)
     */
    @Transactional
    public StudentResponseDTO createStudentInMyClass(Long teacherId, int schoolYear, StudentCreateDTO createDTO) {
        log.info("담당 학급에 학생 등록 - 교사: {}, 학년도: {}", teacherId, schoolYear);

        Classroom myClassroom = getMyClassroomOrThrow(teacherId, schoolYear);

        if (studentInfoRepository.findByAttendanceNum(createDTO.getStudentNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 학번입니다: " + createDTO.getStudentNumber());
        }

        StudentInfo student = new StudentInfo();
        StudentAssignment assignment = new StudentAssignment();
        assignment.setAttendanceNum(createDTO.getStudentNumber());
        assignment.setClassroom(myClassroom);
        assignment.setStudentInfo(student);
        student.getAssignments().add(assignment);
        student.setCurrentAssignment(assignment);
        student.setBirthDate(createDTO.getBirthDate());
        student.setAddress(createDTO.getAddress());
        student.setPhone(createDTO.getPhone());
        student.setGender(createDTO.getGender());

        StudentInfo savedStudent = studentInfoRepository.save(student);
        log.info("담당 학급에 학생 등록 완료 - 학생 ID: {}, 학급: {}",
                savedStudent.getId(), myClassroom.getClassName());

        return StudentResponseDTO.from(savedStudent);
    }

    /**
     * 담당 학급 학생 정보 수정 (담임 전용)
     */
    @Transactional
    public StudentResponseDTO updateMyClassStudent(Long teacherId, int schoolYear, Long studentId,
            StudentUpdateDTO updateDTO) {
        log.info("담당 학급 학생 수정 - 교사: {}, 학생: {}", teacherId, studentId);

        Classroom myClassroom = getMyClassroomOrThrow(teacherId, schoolYear);

        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        if (student.getCurrentAssignment() == null
                || student.getCurrentAssignment().getClassroom() == null
                || !student.getCurrentAssignment().getClassroom().getCid().equals(myClassroom.getCid())) {
            throw new IllegalArgumentException("담당 학급 학생이 아닙니다. 본인 반 학생만 수정할 수 있습니다.");
        }

        if (updateDTO.getClassroomId() != null) {
            log.warn("담당 학급 학생 수정 시 반 이동은 불가합니다. classroomId 무시됨.");
        }
        if (updateDTO.getBirthDate() != null) {
            student.setBirthDate(updateDTO.getBirthDate());
        }
        if (updateDTO.getAddress() != null) {
            student.setAddress(updateDTO.getAddress());
        }
        if (updateDTO.getPhone() != null) {
            student.setPhone(updateDTO.getPhone());
        }
        if (updateDTO.getGender() != null) {
            student.setGender(updateDTO.getGender());
        }

        log.info("담당 학급 학생 수정 완료 - 학생: {}", studentId);
        return StudentResponseDTO.from(student);
    }

    /**
     * 담당 학급 학생 삭제 (담임 전용 - 소프트 삭제)
     */
    @Transactional
    public void deleteMyClassStudent(Long teacherId, int schoolYear, Long studentId) {
        log.info("담당 학급 학생 삭제(자퇴) - 교사: {}, 학생: {}", teacherId, studentId);

        Classroom myClassroom = getMyClassroomOrThrow(teacherId, schoolYear);

        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        if (student.getCurrentAssignment() == null
                || student.getCurrentAssignment().getClassroom() == null
                || !student.getCurrentAssignment().getClassroom().getCid().equals(myClassroom.getCid())) {
            throw new IllegalArgumentException("담당 학급 학생이 아닙니다. 본인 반 학생만 삭제할 수 있습니다.");
        }

        student.setStatus(StudentStatus.DROPOUT);
        log.info("담당 학급 학생 삭제(자퇴) 완료 - 학생: {}", studentId);
    }

    /**
     * 담당 학급 학생 성적 입력 (담임 전용)
     */
    @Transactional
    public void inputGradeForMyClass(Long teacherId, int schoolYear, GradeInputDTO gradeDTO) {
        log.info("담당 학급 학생 성적 입력 - 교사: {}, 학생: {}", teacherId, gradeDTO.getStudentId());

        Classroom myClassroom = getMyClassroomOrThrow(teacherId, schoolYear);

        StudentInfo student = studentInfoRepository.findById(gradeDTO.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        if (student.getCurrentAssignment() == null
                || student.getCurrentAssignment().getClassroom() == null
                || !student.getCurrentAssignment().getClassroom().getCid().equals(myClassroom.getCid())) {
            throw new IllegalArgumentException("담당 학급 학생이 아닙니다. 본인 반 학생의 성적만 입력할 수 있습니다.");
        }

        Subject subject = subjectRepository.findByCode(gradeDTO.getSubjectCode())
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다: " + gradeDTO.getSubjectCode()));

        Grade grade = Grade.builder()
                .student(student)
                .subject(subject)
                .testType(gradeDTO.getTestType())
                .semester(gradeDTO.getSemester())
                .year(gradeDTO.getYear())
                .score(gradeDTO.getScore())
                .build();

        gradeRepository.save(grade);
        log.info("담당 학급 학생 성적 입력 완료 - 학생: {}, 과목: {}, 점수: {}",
                student.getId(), subject.getName(), gradeDTO.getScore());
    }

    /**
     * 담당 학급 학생인지 확인
     */
    public boolean isMyClassStudent(Long teacherId, int schoolYear, Long studentId) {
        Optional<Classroom> myClassroom = getMyClassroom(teacherId, schoolYear);
        if (myClassroom.isEmpty()) {
            return false;
        }

        Optional<StudentInfo> student = studentInfoRepository.findById(studentId);
        if (student.isEmpty()
                || student.get().getCurrentAssignment() == null
                || student.get().getCurrentAssignment().getClassroom() == null) {
            return false;
        }

        return student.get().getCurrentAssignment().getClassroom().getCid()
                .equals(myClassroom.get().getCid());
    }

    // ==================================================================================
    // ========== private 헬퍼 ==========
    // ==================================================================================

    private ClassStudentDTO buildClassStudentDTO(Classroom classroom) {
        List<StudentInfo> students = studentInfoRepository.findByClassroomCid(classroom.getCid());

        List<ClassStudentDTO.StudentSimpleDTO> studentDTOs = students.stream()
                .map(s -> ClassStudentDTO.StudentSimpleDTO.builder()
                        .studentId(s.getId())
                        .name(s.getUser() != null ? s.getUser().getName() : "이름없음")
                        .studentNumber(s.getCurrentAssignment() != null
                                ? s.getCurrentAssignment().getAttendanceNum()
                                : null)
                        .phone(s.getPhone())
                        .email(s.getUser() != null ? s.getUser().getEmail() : null)
                        .build())
                .collect(Collectors.toList());

        String homeroomName = null;
        if (classroom.getHomeroomTeacher() != null && classroom.getHomeroomTeacher().getUser() != null) {
            homeroomName = classroom.getHomeroomTeacher().getUser().getName();
        }

        return ClassStudentDTO.builder()
                .classroomId(classroom.getCid())
                .year(classroom.getYear())
                .grade(classroom.getGrade())
                .classNum(classroom.getClassNum())
                .className(classroom.getClassName())
                .totalStudents(students.size())
                .homeroomTeacherName(homeroomName)
                .students(studentDTOs)
                .build();
    }

    private Long getUserUidFromTeacherId(Long teacherId) {
        TeacherInfo teacher = teacherInfoRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + teacherId));
        if (teacher.getUser() == null) {
            throw new IllegalArgumentException("교사의 사용자 정보가 없습니다. ID: " + teacherId);
        }
        return teacher.getUser().getUid();
    }

    private GradeDTO entityToDto(Grade grade) {
        return GradeDTO.builder()
                .id(grade.getId())
                .subjectName(grade.getSubject() != null ? grade.getSubject().getName() : null)
                .subjectCode(grade.getSubject() != null ? grade.getSubject().getCode() : null)
                .examType(grade.getTestType())
                .score(grade.getScore())
                .semester(grade.getSemester())
                .year(grade.getYear())
                .build();
    }
}
