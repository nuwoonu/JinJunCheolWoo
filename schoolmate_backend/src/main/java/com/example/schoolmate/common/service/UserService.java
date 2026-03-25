package com.example.schoolmate.common.service;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.user.RoleRequest;
import com.example.schoolmate.common.entity.user.SchoolAdminGrant;
import com.example.schoolmate.common.entity.user.constant.GrantedRole;
import com.example.schoolmate.common.repository.SchoolAdminGrantRepository;
import com.example.schoolmate.common.repository.info.parent.ParentInfoRepository;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.repository.RoleRequestRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.common.util.NotificationHelper;
import com.example.schoolmate.dto.CustomUserDTO;
import com.example.schoolmate.dto.PasswordDTO;
import lombok.RequiredArgsConstructor;
import java.util.List;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * 회원 관련 비즈니스 로직 서비스
 * 로그인은 CustomUserDetailsService가 담당
 */
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ParentInfoRepository parentInfoRepository;
    private final RoleRequestRepository roleRequestRepository;
    private final SchoolAdminGrantRepository schoolAdminGrantRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClassroomRepository classroomRepository;
    private final SchoolRepository schoolRepository;

    /**
     * 회원가입 - 새 엔티티 구조 (User + Info)
     */
    public Long join(CustomUserDTO dto) {
        log.info("회원가입 시도: {}, 역할: {}", dto.getEmail(), dto.getRole());

        // 이메일 중복 체크
        if (existsByEmail(dto.getEmail())) {
            throw new IllegalStateException("이미 사용중인 이메일입니다: " + dto.getEmail());
        }

        // 1. User 생성
        User user = User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .name(dto.getName())
                .build();

        // 2. 역할 추가
        user.addRole(dto.getRole());

        // 3. 역할별 Info 생성
        switch (dto.getRole()) {
            case STUDENT -> createStudentInfo(user, dto);
            case TEACHER -> createTeacherInfo(user, dto);
            case PARENT -> createParentInfo(user, dto);
            case ADMIN -> {
            } // Admin은 Info 없이 역할만
            default -> throw new IllegalArgumentException("지원하지 않는 역할입니다: " + dto.getRole());
        }

        User savedUser = userRepository.save(user);
        log.info("회원가입 완료: {}, ID: {}", savedUser.getEmail(), savedUser.getUid());

        // 역할별 RoleRequest 생성 (PENDING 승인 대기)
        if (dto.getRole() != UserRole.ADMIN) {
            roleRequestRepository.save(new RoleRequest(savedUser, dto.getRole(), dto.getSchoolId()));
        }

        // 교사/학부모 가입 시 관리자에게 승인 요청 알림 발송
        if (dto.getRole() == UserRole.TEACHER) {
            notifyAdminsOfNewTeacher(savedUser);
        } else if (dto.getRole() == UserRole.PARENT) {
            notifyAdminsOfNewParent(savedUser);
        }

        return savedUser.getUid();
    }

    // [변경 전] dto에서 학번(studentIdentityNum 또는 studentNumber)을 가져옴
    // 회원가입 폼에서 학번을 입력하지 않으면 null이 되어 DB 저장 시 에러 발생
    // "Column 'code' cannot be null" 에러

    private void createStudentInfo(User user, CustomUserDTO dto) {
        StudentInfo studentInfo = new StudentInfo();
        studentInfo.setUser(user);
        studentInfo.setStatus(StudentStatus.ENROLLED);
        studentInfo.setPrimary(true); // 신규 가입 = 최초 인스턴스 → 항상 primary
        studentInfo.setPhone(dto.getPhoneNumber());
        if (dto.getSchoolId() != null) {
            schoolRepository.findById(dto.getSchoolId()).ifPresent(studentInfo::setSchool);
        }

        // studentInfo.setCode(dto.getStudentIdentityNum() != null
        // ? dto.getStudentIdentityNum()
        // : dto.getStudentNumber());

        // ========== [변경] code를 UUID로 생성 (2025-01-29 woo) ==========
        // 학번이 있으면 사용, 없으면 UUID로 임시값 생성 (관리자가 나중에 수정)
        String code = dto.getStudentIdentityNum();
        if (code == null || code.isEmpty()) {
            code = java.util.UUID.randomUUID().toString();
        }
        studentInfo.setCode(code);
        // ================================================================

        // 초기 학급 배정
        if (dto.getGrade() != null && dto.getClassNum() != null) {
            int currentYear = LocalDate.now().getYear();
            // [woo 03/25] 학교별 학급 조회 (다중학교 대응)
            Long schoolId = SchoolContextHolder.getSchoolId();
            Classroom classroom = classroomRepository
                    .findBySchoolIdAndYearAndGradeAndClassNum(schoolId, currentYear, dto.getGrade(), dto.getClassNum()).orElse(null);
            if (classroom != null) {
                StudentAssignment assignment = StudentAssignment.builder()
                        .studentInfo(studentInfo)
                        .schoolYear(currentYear)
                        .classroom(classroom)
                        .attendanceNum(dto.getStudentNum())
                        .build();
                studentInfo.getAssignments().add(assignment);
                studentInfo.setCurrentAssignment(assignment);
            }
        }

        user.getInfos().add(studentInfo);
    }

    private void createTeacherInfo(User user, CustomUserDTO dto) {
        TeacherInfo teacherInfo = new TeacherInfo();
        teacherInfo.setUser(user);
        teacherInfo.setStatus(TeacherStatus.EMPLOYED);
        teacherInfo.setPrimary(true); // 신규 가입 = 최초 인스턴스 → 항상 primary
        teacherInfo.setPhone(dto.getPhoneNumber());
        if (dto.getSchoolId() != null) {
            schoolRepository.findById(dto.getSchoolId()).ifPresent(teacherInfo::setSchool);
        }

        // ========== [변경] code를 UUID로 생성 (2025-01-29 woo) ==========
        // 사번이 있으면 사용, 없으면 UUID로 임시값 생성 (관리자가 나중에 수정)
        String code = dto.getEmployeeNumber();
        if (code == null || code.isEmpty()) {
            code = java.util.UUID.randomUUID().toString();
        }
        teacherInfo.setCode(code);
        // ================================================================

        // 나머지는 null 허용 (관리자가 나중에 설정)
        teacherInfo.setSubject(dto.getSubject());
        teacherInfo.setDepartment(dto.getDepartment());
        teacherInfo.setPosition(dto.getPosition());

        user.getInfos().add(teacherInfo);
    }

    private void createParentInfo(User user, CustomUserDTO dto) {
        ParentInfo parentInfo = new ParentInfo();
        parentInfo.setUser(user);
        parentInfo.setParentName(dto.getName());
        parentInfo.setPhone(dto.getPhoneNumber());

        // ========== [변경] 중복 code 체크 추가 (2025-01-29 woo) ==========
        // 동일한 이메일 아이디로 가입 시 중복 에러 방지
        String code = "TEMP_" + user.getEmail().split("@")[0];
        if (parentInfoRepository.existsByCode(code)) {
            throw new IllegalStateException("이미 사용 중인 아이디입니다. 다른 이메일로 가입해주세요.");
        }
        parentInfo.setCode(code);
        // ================================================================

        user.getInfos().add(parentInfo);
    }

    /**
     * 소셜 로그인 역할 선택 후 Info 엔티티 생성 (승인대기 상태로)
     * - LoginController.postSelectRole()에서 호출
     */
    public void createSocialUserInfo(User user, UserRole role, Long schoolId) {
        switch (role) {
            case STUDENT -> {
                boolean isFirst = user.getInfos().stream().noneMatch(i -> i instanceof StudentInfo);
                StudentInfo studentInfo = new StudentInfo();
                studentInfo.setUser(user);
                studentInfo.setStatus(StudentStatus.ENROLLED);
                studentInfo.setCode(java.util.UUID.randomUUID().toString());
                studentInfo.setPrimary(isFirst);
                if (schoolId != null) {
                    schoolRepository.findById(schoolId).ifPresent(studentInfo::setSchool);
                }
                user.getInfos().add(studentInfo);
            }
            case TEACHER -> {
                boolean isFirst = user.getInfos().stream().noneMatch(i -> i instanceof TeacherInfo);
                TeacherInfo teacherInfo = new TeacherInfo();
                teacherInfo.setUser(user);
                teacherInfo.setStatus(TeacherStatus.EMPLOYED);
                teacherInfo.setCode(java.util.UUID.randomUUID().toString());
                teacherInfo.setPrimary(isFirst);
                if (schoolId != null) {
                    schoolRepository.findById(schoolId).ifPresent(teacherInfo::setSchool);
                }
                user.getInfos().add(teacherInfo);
            }
            case PARENT -> {
                ParentInfo parentInfo = new ParentInfo();
                parentInfo.setUser(user);
                parentInfo.setParentName(user.getName());
                String code = "TEMP_" + user.getEmail().split("@")[0];
                if (parentInfoRepository.existsByCode(code)) {
                    code = "TEMP_" + java.util.UUID.randomUUID().toString().substring(0, 8);
                }
                parentInfo.setCode(code);
                user.getInfos().add(parentInfo);
            }
            default -> {
            } // ADMIN은 Info 없이 역할만
        }
        userRepository.save(user);

        // RoleRequest 생성 — 같은 (user, role, schoolId) 조합이 이미 있으면 skip
        if (role != UserRole.ADMIN) {
            boolean alreadyExists = schoolId != null
                    ? roleRequestRepository.existsByUserAndRoleAndSchoolId(user, role, schoolId)
                    : roleRequestRepository.existsByUserAndRoleAndSchoolIdIsNull(user, role);
            if (alreadyExists) {
                return; // 중복 신청 무시
            }
            boolean isAdmin = user.getRoles().contains(UserRole.ADMIN);
            RoleRequest roleRequest = isAdmin
                    ? RoleRequest.createActive(user, role, schoolId, null)
                    : new RoleRequest(user, role, schoolId);
            roleRequestRepository.save(roleRequest);

            // ADMIN 자동 승인된 경우 관리자 알림 불필요 (본인이 스스로 승인한 것이므로)
            if (!isAdmin) {
                if (role == UserRole.TEACHER) {
                    notifyAdminsOfNewTeacher(user);
                } else if (role == UserRole.PARENT) {
                    notifyAdminsOfNewParent(user);
                }
            }
        }
    }

    /**
     * 비밀번호 변경
     */
    public void changePassword(PasswordDTO dto) throws IllegalStateException {
        log.info("비밀번호 변경 시도: {}", dto.getEmail());

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("회원정보를 찾을 수 없습니다."));

        if (passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            user.changePassword(passwordEncoder.encode(dto.getNewPassword()));
            log.info("비밀번호 변경 완료: {}", dto.getEmail());
        } else {
            throw new IllegalStateException("현재 비밀번호가 일치하지 않습니다.");
        }
    }

    /**
     * 이름 변경
     */
    public void changeName(CustomUserDTO dto) {
        log.info("이름 변경 시도: {}", dto.getEmail());

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("회원정보를 찾을 수 없습니다."));

        user.changeName(dto.getName());
        log.info("이름 변경 완료: {} -> {}", dto.getEmail(), dto.getName());
    }

    /**
     * 회원 탈퇴
     */
    public void leave(CustomUserDTO dto) {
        log.info("회원 탈퇴 시도: {}", dto.getEmail());

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("회원정보를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalStateException("비밀번호가 일치하지 않습니다.");
        }

        // 프로필 삭제
        Optional<Profile> profile = profileRepository.findByUser(user);
        profile.ifPresent(profileRepository::delete);
        log.info("프로필 삭제 완료: {}", dto.getEmail());

        // User 삭제 (CascadeType.ALL로 Info도 자동 삭제)
        userRepository.delete(user);
        log.info("회원 탈퇴 완료: {}", dto.getEmail());
    }

    /**
     * 이메일로 사용자 조회
     */
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
    }

    /**
     * 이메일 존재 여부 확인
     */
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * 교사 신규 가입 시 알림 발송 대상:
     * 1. SUPER_ADMIN (UserRole.ADMIN 전체)
     * 2. 해당 학교의 TEACHER_MANAGER 또는 SCHOOL_ADMIN 권한 보유자
     * 동일인 중복 발송 방지 (uid 기준 dedup)
     */
    private void notifyAdminsOfNewTeacher(User teacher) {
        TeacherInfo info = teacher.getInfo(TeacherInfo.class);
        Long schoolId = (info != null && info.getSchool() != null) ? info.getSchool().getId() : null;
        String actionUrl = "/admin/teachers" + (schoolId != null ? "?schoolId=" + schoolId : "");

        // uid → User 맵으로 중복 제거
        Map<Long, User> recipients = new LinkedHashMap<>();
        userRepository.findAllByRole(UserRole.ADMIN)
                .forEach(u -> recipients.put(u.getUid(), u));

        if (schoolId != null) {
            schoolAdminGrantRepository
                    .findBySchool_IdAndGrantedRoleIn(schoolId,
                            List.of(GrantedRole.SCHOOL_ADMIN, GrantedRole.TEACHER_MANAGER))
                    .stream()
                    .map(SchoolAdminGrant::getUser)
                    .forEach(u -> recipients.putIfAbsent(u.getUid(), u));
        }

        for (User recipient : recipients.values()) {
            NotificationHelper.send(
                    teacher, recipient,
                    "신규 교사 가입 승인 요청",
                    teacher.getName() + " 교사가 회원가입을 완료했습니다. 승인 처리를 해주세요.",
                    actionUrl
            );
        }
    }

    /**
     * 학부모 신규 가입 시 알림 발송 대상:
     * 1. SUPER_ADMIN (UserRole.ADMIN 전체)
     * 2. 임의 학교의 PARENT_MANAGER 또는 SCHOOL_ADMIN 권한 보유자
     * 동일인 중복 발송 방지
     */
    private void notifyAdminsOfNewParent(User parent) {
        Map<Long, User> recipients = new LinkedHashMap<>();
        userRepository.findAllByRole(UserRole.ADMIN)
                .forEach(u -> recipients.put(u.getUid(), u));

        schoolAdminGrantRepository
                .findByGrantedRoleIn(List.of(GrantedRole.SCHOOL_ADMIN, GrantedRole.PARENT_MANAGER))
                .stream()
                .map(SchoolAdminGrant::getUser)
                .forEach(u -> recipients.putIfAbsent(u.getUid(), u));

        for (User recipient : recipients.values()) {
            NotificationHelper.send(
                    parent, recipient,
                    "신규 학부모 가입 승인 요청",
                    parent.getName() + " 학부모가 회원가입을 완료했습니다. 승인 처리를 해주세요.",
                    "/admin/parents"
            );
        }
    }

    /**
     * 이메일로 사용자 DTO 조회
     */
    @Transactional(readOnly = true)
    public CustomUserDTO getUserDTOByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
        return entityToDTO(user);
    }

    /**
     * User 엔티티를 CustomUserDTO로 변환
     */
    private CustomUserDTO entityToDTO(User user) {
        CustomUserDTO.CustomUserDTOBuilder builder = CustomUserDTO.builder()
                .uid(user.getUid())
                .email(user.getEmail())
                .password(user.getPassword())
                .name(user.getName())
                .roles(user.getRoles());

        // 역할별 Info 정보 추가
        StudentInfo studentInfo = user.getInfo(StudentInfo.class);
        if (studentInfo != null) {
            builder.role(UserRole.STUDENT)
                    .studentIdentityNum(studentInfo.getCode());

            StudentAssignment assignment = studentInfo.getCurrentAssignment();
            if (assignment != null) {
                builder.grade(assignment.getGrade())
                        .classNum(assignment.getClassNum())
                        .studentNum(assignment.getAttendanceNum())
                        .schoolYear(assignment.getSchoolYear());
            }
        }

        TeacherInfo teacherInfo = user.getInfo(TeacherInfo.class);
        if (teacherInfo != null) {
            builder.role(UserRole.TEACHER)
                    .employeeNumber(teacherInfo.getCode())
                    .subject(teacherInfo.getSubject())
                    .department(teacherInfo.getDepartment())
                    .position(teacherInfo.getPosition());
        }

        ParentInfo parentInfo = user.getInfo(ParentInfo.class);
        if (parentInfo != null) {
            builder.role(UserRole.PARENT)
                    .phoneNumber(parentInfo.getPhone());
        }

        // 기본 역할 설정 (Info가 없는 경우)
        if (studentInfo == null && teacherInfo == null && parentInfo == null) {
            if (user.hasRole(UserRole.ADMIN)) {
                builder.role(UserRole.ADMIN);
            } else if (!user.getRoles().isEmpty()) {
                builder.role(user.getRoles().iterator().next());
            }
        }

        return builder.build();
    }
}
