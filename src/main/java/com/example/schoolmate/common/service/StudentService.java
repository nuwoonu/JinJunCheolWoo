package com.example.schoolmate.common.service;

import java.io.Reader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.constant.ClassroomStatus;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.common.repository.info.FamilyRelationRepository;
import com.example.schoolmate.common.repository.info.parent.ParentInfoRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.opencsv.bean.CsvToBeanBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 관리자 학생 관리 서비스
 * 
 * 학생(User + StudentInfo) 데이터에 대한 CRUD 및 비즈니스 로직을 담당합니다.
 * - 학번 생성 및 중복 체크
 * - 학급 배정 이력 관리 및 보호자 관계(FamilyRelation) 설정
 */
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class StudentService {
    private final UserRepository userRepository;
    private final ParentInfoRepository parentInfoRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final ClassroomRepository classroomRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 1. 학생 목록 조회 (마스터 목록)
     */
    @Transactional(readOnly = true)
    public Page<StudentDTO.SummaryResponse> getStudentSummaryList(StudentDTO.StudentSearchCondition cond,
            Pageable pageable) {
        // QueryHandler에서 연도/학년/반 필터를 제거한 searchStudents를 호출
        return studentInfoRepository.search(cond, pageable)
                .map(StudentDTO.SummaryResponse::new); // DTO 내부에서 '가장 최근 소속'을 추출하도록 설계
    }

    /**
     * 해당 학년도의 개설된 학급 목록 조회 (등록 폼 드롭다운용)
     */
    @Transactional(readOnly = true)
    public List<ClassDTO.DetailResponse> getOpenClassrooms(int year) {
        ClassDTO.SearchCondition cond = new ClassDTO.SearchCondition();
        cond.setYear(year);
        cond.setStatus(ClassroomStatus.ACTIVE.name());
        return classroomRepository.search(cond, Pageable.unpaged())
                .map(c -> ClassDTO.DetailResponse.from(c, 0)).getContent();
    }

    /**
     * 2. 학생 상세 정보 조회
     */
    @Transactional(readOnly = true)
    public StudentDTO.DetailResponse getStudentDetail(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. UID: " + uid));
        StudentDTO.DetailResponse response = new StudentDTO.DetailResponse(user);

        // 보호자 목록 조회 (UID 기반)
        List<FamilyRelation> relations = familyRelationRepository
                .findByStudentInfo_User_Uid(uid);
        response.setGuardians(relations.stream().map(StudentDTO.LinkedGuardian::new).toList());

        return response;
    }

    /**
     * 3. 학생 신규 등록 (계정 생성)
     * 인적 사항 위주로 계정을 생성합니다. 학급 정보는 선택 사항입니다.
     */
    public Long createStudent(StudentDTO.CreateRequest request) {
        // 1. 유저 및 권한 설정
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
                .build();

        // 2. 학생 상세 정보 설정
        StudentInfo info = new StudentInfo();
        info.setCode(request.getCode());
        info.setStatus(StudentStatus.ENROLLED);
        info.setUser(user);
        user.getInfos().add(info);

        // 3. 학급 배정 정보(선택 사항) 처리
        if (request.getClassroomId() != null) {
            // 학급 ID로 직접 배정 (UI 선택)
            classroomRepository.findById(request.getClassroomId())
                    .ifPresent(classroom -> {
                        // 자동 번호 생성 (마지막 번호 + 1)
                        int nextNum = studentInfoRepository.findMaxAttendanceNum(classroom.getYear(),
                                classroom.getGrade(),
                                classroom.getClassNum()) + 1;

                        StudentAssignment assignment = new StudentAssignment();
                        assignment.setStudentInfo(info);
                        assignment.setSchoolYear(classroom.getYear());
                        assignment.setClassroom(classroom);
                        assignment.setAttendanceNum(nextNum);

                        info.getAssignments().add(assignment);
                        info.setCurrentAssignment(assignment);
                    });
        } else if (request.getYear() != null && request.getGrade() != null && request.getClassNum() != null) {
            // 기존 방식 또는 CSV 업로드 (학년/반 정보로 배정)
            classroomRepository.findByYearAndGradeAndClassNum(
                    request.getYear(), request.getGrade(), request.getClassNum())
                    .ifPresent(classroom -> {
                        StudentAssignment assignment = new StudentAssignment();
                        assignment.setSchoolYear(request.getYear());
                        assignment.setClassroom(classroom);
                        assignment.setAttendanceNum(request.getAttendanceNum());
                        assignment.setStudentInfo(info);
                        info.getAssignments().add(assignment);
                        info.setCurrentAssignment(assignment);
                    });
        }

        // 4. 보호자 연동 처리
        if (request.getGuardians() != null && !request.getGuardians().isEmpty()) {
            for (StudentDTO.ParentRelationRequest req : request.getGuardians()) {
                ParentInfo parentInfo = parentInfoRepository.findById(req.getParentId()).orElse(null);
                if (parentInfo != null) {
                    FamilyRelation relation = new FamilyRelation();
                    relation.setStudentInfo(info);
                    relation.setParentInfo(parentInfo);
                    relation.setRelationship(FamilyRelationship.valueOf(req.getRelationship()));
                    // 양방향 연관관계 설정 (ParentInfo가 주인인 경우)
                    parentInfo.getChildrenRelations().add(relation);
                }
            }
        }

        // 4. 저장 및 학번 반환
        userRepository.save(user);

        // 저장된 User UID 반환
        return user.getUid();
    }

    /**
     * 학생 인적사항 및 상태 수정
     */
    public void updateStudentBasicInfo(StudentDTO.UpdateRequest request) {
        User user = userRepository.findById(request.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        user.setName(request.getName());

        StudentInfo info = user.getInfo(StudentInfo.class);
        if (info != null) {
            // 학번 변경 시 중복 체크 로직이 필요할 수 있음
            info.setCode(request.getCode());
            if (request.getStatusName() != null) {
                info.setStatus(StudentStatus.valueOf(request.getStatusName()));
            }
            info.setBasicHabits(request.getBasicHabits());
            info.setSpecialNotes(request.getSpecialNotes());
        }
    }

    /**
     * 학적 이력 수정
     */
    public Long updateAssignment(StudentDTO.AssignmentRequest request) {
        User user = userRepository.findById(request.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        StudentInfo info = user.getInfo(StudentInfo.class);

        StudentAssignment assignment = info.getAssignments().stream()
                .filter(a -> a.getSchoolYear() == request.getSchoolYear())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("수정할 배정 정보를 찾을 수 없습니다."));

        // 학급 정보 조회
        if (request.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new IllegalArgumentException("해당 학급을 찾을 수 없습니다."));

            // 학급이 변경된 경우에만 처리 (같은 반이면 아무것도 안 함)
            if (assignment.getClassroom() == null || !assignment.getClassroom().getCid().equals(classroom.getCid())) {
                // 1. 새 학급에서의 번호 먼저 계산
                int nextNum = studentInfoRepository.findMaxAttendanceNum(classroom.getYear(), classroom.getGrade(),
                        classroom.getClassNum()) + 1;

                // 2. 학급 및 번호 변경
                assignment.setClassroom(classroom);
                assignment.setAttendanceNum(nextNum);
            }
        }

        return user.getUid();
    }

    @Transactional(rollbackFor = Exception.class)
    public void importStudentsFromCsv(MultipartFile file) throws Exception {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            log.info("CSV 파일 읽기 시작: {}", file.getOriginalFilename());
            List<StudentDTO.CsvImportRequest> beans = new CsvToBeanBuilder<StudentDTO.CsvImportRequest>(reader)
                    .withType(StudentDTO.CsvImportRequest.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();

            log.info("파싱된 데이터 개수: {}", beans.size());

            for (StudentDTO.CsvImportRequest csvReq : beans) {
                // 1. 중복 체크
                if (userRepository.existsByEmail(csvReq.getEmail())) {
                    throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + csvReq.getEmail());
                }
                if (studentInfoRepository.existsByCode(csvReq.getCode())) {
                    throw new IllegalArgumentException("이미 존재하는 학번입니다: " + csvReq.getCode());
                }

                // 2. DTO 변환 및 생성 로직 재사용
                StudentDTO.CreateRequest createReq = new StudentDTO.CreateRequest(csvReq);
                createStudent(createReq);
            }
        } catch (Exception e) {
            log.error("CSV 처리 중 오류 발생: ", e);
            throw e;
        }
    }

    public Long deleteAssignment(Long uid, int schoolYear) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        StudentInfo info = user.getInfo(StudentInfo.class);

        // 해당 학년도의 이력만 제거
        info.getAssignments().removeIf(a -> a.getSchoolYear() == schoolYear);

        if (info.getCurrentAssignment() != null && info.getCurrentAssignment().getSchoolYear() == schoolYear) {
            info.setCurrentAssignment(info.getLatestAssignment().orElse(null));
        }

        return user.getUid();
    }

    /**
     * 학생 상태 일괄 변경 (예: 졸업 처리)
     */
    public void bulkUpdateStudentStatus(List<Long> uids, String statusName) {
        StudentStatus status = StudentStatus.valueOf(statusName);
        List<User> users = userRepository.findAllById(uids);
        for (User user : users) {
            StudentInfo info = user.getInfo(StudentInfo.class);
            if (info != null) {
                info.setStatus(status);
            }
        }
    }

    /**
     * 보호자 추가 (기존 학생)
     */
    public void addGuardian(Long uid, Long parentId, FamilyRelationship relationship) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        StudentInfo studentInfo = user.getInfo(StudentInfo.class);

        ParentInfo parentInfo = parentInfoRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("학부모 정보를 찾을 수 없습니다."));

        boolean exists = parentInfo.getChildrenRelations().stream()
                .anyMatch(r -> r.getStudentInfo().getId().equals(studentInfo.getId()));

        if (!exists) {
            FamilyRelation relation = new FamilyRelation();
            relation.setStudentInfo(studentInfo);
            relation.setParentInfo(parentInfo);
            relation.setRelationship(relationship);
            parentInfo.getChildrenRelations().add(relation);
        }
    }

    /**
     * 보호자 연동 해제
     */
    public void removeGuardian(Long uid, Long parentId) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        StudentInfo studentInfo = user.getInfo(StudentInfo.class);

        ParentInfo parentInfo = parentInfoRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("학부모 정보를 찾을 수 없습니다."));
        parentInfo.getChildrenRelations()
                .removeIf(r -> r.getStudentInfo().getId().equals(studentInfo.getId()));
    }

    /**
     * 보호자 관계 수정
     */
    public void updateGuardianRelationship(Long uid, Long parentId, FamilyRelationship relationship) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        StudentInfo studentInfo = user.getInfo(StudentInfo.class);

        FamilyRelation relation = studentInfo.getFamilyRelations().stream()
                .filter(r -> r.getParentInfo().getId().equals(parentId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("연동된 보호자가 아닙니다."));
        relation.setRelationship(relationship);
    }

    // 승철님 작업물
    // [woo 수정] 기존 코드에서 User 생성 누락 + BaseInfo.code null → DB 제약 위반 에러 수정
    // 변경사항:
    //   1. classroomId 없으면 grade+classNum으로 학급 조회 (담임 교사 폼 지원)
    //   2. User 계정 생성 추가 (name/email/password/STUDENT role)
    //   3. code 자동 생성 (년도+학년+반+번호)
    //   4. user.addInfo(student)로 양방향 연관관계 설정
    //   5. studentInfoRepository.save() → userRepository.save(user)로 변경 (cascade)
    @Transactional
    public StudentResponseDTO createStudent(StudentCreateDTO createDTO) {
        // 학번 중복 체크
        if (studentInfoRepository.findByAttendanceNum(createDTO.getStudentNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 학번입니다: " + createDTO.getStudentNumber());
        }

        // Classroom 조회 (classroomId 우선, 없으면 grade+classNum으로 조회)
        Classroom classroom;
        if (createDTO.getClassroomId() != null) {
            classroom = classroomRepository.findById(createDTO.getClassroomId())
                    .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + createDTO.getClassroomId()));
        } else {
            int year = java.time.LocalDate.now().getYear();
            classroom = classroomRepository.findByYearAndGradeAndClassNum(year, createDTO.getGrade(), createDTO.getClassNum())
                    .orElseThrow(() -> new IllegalArgumentException(
                            createDTO.getGrade() + "학년 " + createDTO.getClassNum() + "반 학급을 찾을 수 없습니다."));
        }

        // 이메일 중복 체크
        if (userRepository.existsByEmail(createDTO.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + createDTO.getEmail());
        }

        // User 계정 생성
        User user = User.builder()
                .name(createDTO.getName())
                .email(createDTO.getEmail())
                .password(passwordEncoder.encode(createDTO.getPassword()))
                .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
                .build();

        // 학생 코드 자동 생성 (년도+학년+반+번호, 예: 2026010105)
        String code = String.format("%d%02d%02d%02d",
                classroom.getYear(), classroom.getGrade(), classroom.getClassNum(), createDTO.getStudentNumber());

        // StudentInfo 생성 및 User 연동
        StudentInfo student = new StudentInfo();
        student.setCode(code);
        student.setStatus(StudentStatus.ENROLLED);
        student.setBirthDate(createDTO.getBirthDate());
        student.setAddress(createDTO.getAddress());
        student.setPhone(createDTO.getPhone());
        student.setGender(createDTO.getGender());
        user.addInfo(student);

        // 학급 배정 생성
        StudentAssignment assignment = new StudentAssignment();
        assignment.setStudentInfo(student);
        assignment.setSchoolYear(classroom.getYear());
        assignment.setClassroom(classroom);
        assignment.setAttendanceNum(createDTO.getStudentNumber());
        student.getAssignments().add(assignment);
        student.setCurrentAssignment(assignment);

        userRepository.save(user);
        return convertToResponseDTO(student);
    }

    // 승철님 작업물
    @Transactional(readOnly = true)
    public StudentResponseDTO getStudentByUid(Long uid) {
        StudentInfo student = studentInfoRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid));
        return convertToResponseDTO(student);
    }

    // 승철님 작업물
    @Transactional(readOnly = true)
    public StudentResponseDTO getStudentByStudentNumber(Integer studentNumber) {
        StudentInfo student = studentInfoRepository.findByAttendanceNum(studentNumber)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. 학번: " + studentNumber));
        return convertToResponseDTO(student);
    }

    // 승철님 작업물
    @Transactional(readOnly = true)
    public List<StudentResponseDTO> getAllStudents() {
        return studentInfoRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // 승철님 작업물
    @Transactional(readOnly = true)
    public List<StudentResponseDTO> getStudentsByGrade(int grade) {
        return studentInfoRepository.findByClassroomGrade(grade).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // 승철님 작업물
    @Transactional(readOnly = true)
    public List<StudentResponseDTO> getStudentsByClassNum(int classNum) {
        return studentInfoRepository.findByClassroomClassNum(classNum).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // 승철님 작업물
    @Transactional(readOnly = true)
    public List<StudentResponseDTO> getStudentsByGradeAndClass(int grade, int classNum) {
        return studentInfoRepository.findByClassroomGradeAndClassroomClassNum(grade, classNum).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // 승철님 작업물
    @Transactional
    public StudentResponseDTO updateStudent(Long uid, StudentUpdateDTO updateDTO) {
        StudentInfo student = studentInfoRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid));

        // 업데이트 가능한 필드만 변경 (Dirty Checking 활용)
        if (updateDTO.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(updateDTO.getClassroomId())
                    .orElseThrow(
                            () -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + updateDTO.getClassroomId()));
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

        // @Transactional로 인해 변경 감지되어 자동 저장됨
        return convertToResponseDTO(student);
    }

    // 승철님 작업물
    @Transactional
    public void deleteStudent(Long uid) {
        StudentInfo student = studentInfoRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid));

        // 소프트 삭제 - Dirty Checking 활용
        student.setStatus(StudentStatus.DROPOUT);
    }

    // 승철님 작업물
    @Transactional
    public void permanentDeleteStudent(Long uid) {
        if (!studentInfoRepository.existsById(uid)) {
            throw new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid);
        }
        studentInfoRepository.deleteById(uid);
    }

    /**
     * [woo 추가] 로그인한 교사의 담임 학급 조회 (당해 연도 기준)
     * AdminService에서 teacher(User) 필드로 담임 배정하므로 User.uid로 조회
     * StudentController.getAddStudentForm()에서 사용 - 담임 아니면 접근 차단
     */
    @Transactional(readOnly = true)
    public java.util.Optional<Classroom> findHomeroomClassroom(Long teacherUid) {
        int year = java.time.LocalDate.now().getYear();
        return classroomRepository.findByTeacherUidAndYear(teacherUid, year);
    }

    // 승철님 작업물
    private StudentResponseDTO convertToResponseDTO(StudentInfo student) {
        return StudentResponseDTO.from(student);
    }
}