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
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.repository.RoleRequestRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.common.util.NotificationHelper;
import com.example.schoolmate.dto.CustomUserDTO;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.data.domain.PageRequest;
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
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final RoleRequestRepository roleRequestRepository;
    private final SchoolAdminGrantRepository schoolAdminGrantRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClassroomRepository classroomRepository;
    private final SchoolRepository schoolRepository;

    /**
     * 이메일 회원가입
     * User 생성 후 processRoleSetup()으로 역할 셋업을 위임
     */
    public Long join(CustomUserDTO dto) {
        log.info("회원가입 시도: {}, 역할: {}", dto.getEmail(), dto.getRole());

        if (existsByEmail(dto.getEmail())) {
            throw new IllegalStateException("이미 사용중인 이메일입니다: " + dto.getEmail());
        }

        User user = User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .name(dto.getName())
                .build();
        user.addRole(dto.getRole());

        processRoleSetup(user, dto.getRole(), dto.getSchoolId(), dto);

        log.info("회원가입 완료: {}, ID: {}", user.getEmail(), user.getUid());
        return user.getUid();
    }

    /**
     * SNS 역할 선택 후 역할 셋업
     * AuthApiController.selectRole()에서 호출
     */
    public void createSocialUserInfo(User user, UserRole role, Long schoolId) {
        processRoleSetup(user, role, schoolId, null);
    }

    /**
     * 역할 셋업 공통 처리: Info 생성 → 저장 → RoleRequest → 알림
     *
     * @param dto 이메일 가입 시에만 존재 (전화번호, 학번 등 추가 정보). SNS 가입은 null.
     */
    private void processRoleSetup(User user, UserRole role, Long schoolId, CustomUserDTO dto) {
        // 1. 역할별 Info 엔티티 생성 (ADMIN은 Info 없음)
        switch (role) {
            case STUDENT -> buildStudentInfo(user, schoolId, dto);
            case TEACHER -> buildTeacherInfo(user, schoolId, dto);
            case PARENT  -> buildParentInfo(user, schoolId, dto);
            case ADMIN   -> { /* Info 없음 */ }
            default -> throw new IllegalArgumentException("지원하지 않는 역할입니다: " + role);
        }

        // 2. 저장 (cascade로 Info도 함께 저장)
        userRepository.save(user);

        // 3. RoleRequest 생성 (ADMIN 제외, 중복 신청 무시)
        if (role == UserRole.ADMIN) return;

        boolean alreadyExists = schoolId != null
                ? roleRequestRepository.existsByUserAndRoleAndSchoolId(user, role, schoolId)
                : roleRequestRepository.existsByUserAndRoleAndSchoolIdIsNull(user, role);
        if (alreadyExists) return;

        boolean isSuperAdmin = user.getRoles().contains(UserRole.ADMIN);
        roleRequestRepository.save(isSuperAdmin
                ? RoleRequest.createActive(user, role, schoolId, null)
                : new RoleRequest(user, role, schoolId));

        // 4. 알림 (SUPER_ADMIN 자동승인 시 생략)
        if (!isSuperAdmin) {
            switch (role) {
                case STUDENT -> notifyAdminsOfNewStudent(user);
                case TEACHER -> notifyAdminsOfNewTeacher(user);
                case PARENT  -> notifyAdminsOfNewParent(user);
                default -> { }
            }
        }
    }

    // ── Info 빌더 ────────────────────────────────────────────────────────────

    private void buildStudentInfo(User user, Long schoolId, CustomUserDTO dto) {
        boolean isFirst = user.getInfos().stream().noneMatch(i -> i instanceof StudentInfo);
        StudentInfo info = new StudentInfo();
        info.setUser(user);
        info.setStatus(StudentStatus.ENROLLED);
        info.setPrimary(isFirst);
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(info::setSchool);
        }

        // 학번: dto에서 가져오거나 연도+순번으로 자동 생성 (예: 20250001)
        String code = (dto != null) ? dto.getStudentIdentityNum() : null;
        info.setCode((code != null && !code.isEmpty()) ? code : generateStudentCode(schoolId));

        if (dto != null) {
            info.setPhone(dto.getPhoneNumber());
            // 학급 배정 (이메일 가입 시 학년·반 정보가 있을 때만)
            if (dto.getGrade() != null && dto.getClassNum() != null) {
                int currentYear = LocalDate.now().getYear();
                Long ctxSchoolId = SchoolContextHolder.getSchoolId();
                classroomRepository
                        .findBySchoolIdAndYearAndGradeAndClassNum(ctxSchoolId, currentYear, dto.getGrade(), dto.getClassNum())
                        .ifPresent(classroom -> {
                            StudentAssignment assignment = StudentAssignment.builder()
                                    .studentInfo(info)
                                    .schoolYear(currentYear)
                                    .classroom(classroom)
                                    .attendanceNum(dto.getStudentNum())
                                    .build();
                            info.getAssignments().add(assignment);
                            info.setCurrentAssignment(assignment);
                        });
            }
        }

        user.getInfos().add(info);
    }

    private void buildTeacherInfo(User user, Long schoolId, CustomUserDTO dto) {
        boolean isFirst = user.getInfos().stream().noneMatch(i -> i instanceof TeacherInfo);
        TeacherInfo info = new TeacherInfo();
        info.setUser(user);
        info.setStatus(TeacherStatus.EMPLOYED);
        info.setPrimary(isFirst);
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(info::setSchool);
        }

        // 사번: dto에서 가져오거나 연도+순번으로 자동 생성 (예: T20250001)
        String code = (dto != null) ? dto.getEmployeeNumber() : null;
        info.setCode((code != null && !code.isEmpty()) ? code : generateTeacherCode(schoolId));

        if (dto != null) {
            info.setPhone(dto.getPhoneNumber());
            info.setSubject(dto.getSubject());
            info.setDepartment(dto.getDepartment());
            info.setPosition(dto.getPosition());
        }

        user.getInfos().add(info);
    }

    private void buildParentInfo(User user, Long schoolId, CustomUserDTO dto) {
        ParentInfo info = new ParentInfo();
        info.setUser(user);
        info.setParentName(user.getName());

        if (dto != null) {
            info.setPhone(dto.getPhoneNumber());
        }

        // 학부모 코드: TEMP_{이메일 아이디}, 중복 시 TEMP_{UUID 앞 8자리}
        String code = "TEMP_" + user.getEmail().split("@")[0];
        if (parentInfoRepository.existsByCode(code)) {
            if (dto != null) {
                // 이메일 가입: 동일 이메일 아이디 중복은 가입 불가
                throw new IllegalStateException("이미 사용 중인 아이디입니다. 다른 이메일로 가입해주세요.");
            }
            code = "TEMP_" + java.util.UUID.randomUUID().toString().substring(0, 8);
        }
        info.setCode(code);

        user.getInfos().add(info);
    }

    /**
     * 비밀번호 변경 (이메일 인증 완료 후 호출)
     */
    public void changePassword(Long userId, String newPassword) {
        log.info("비밀번호 변경 시도: userId={}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("회원정보를 찾을 수 없습니다."));
        user.changePassword(passwordEncoder.encode(newPassword));
        log.info("비밀번호 변경 완료: userId={}", userId);
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
     * 학번 자동 생성: YYYY + 4자리 순번 (예: 20250001)
     * 학교 내 동일 연도 기준 마지막 학번에서 +1
     */
    private String generateStudentCode(Long schoolId) {
        String prefix = String.valueOf(LocalDate.now().getYear());
        if (schoolId != null) {
            List<StudentInfo> latest = studentInfoRepository
                    .findBySchoolIdAndCodeStartingWithOrderByCodeDesc(schoolId, prefix, PageRequest.of(0, 1));
            if (!latest.isEmpty()) {
                try {
                    int seq = Integer.parseInt(latest.get(0).getCode().substring(4)) + 1;
                    return prefix + String.format("%04d", seq);
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return prefix + "0001";
    }

    /**
     * 사번 자동 생성: T + YYYY + 4자리 순번 (예: T20250001)
     * 학교 내 동일 연도 기준 마지막 사번에서 +1
     */
    private String generateTeacherCode(Long schoolId) {
        String prefix = "T" + LocalDate.now().getYear();
        if (schoolId != null) {
            List<TeacherInfo> latest = teacherInfoRepository
                    .findBySchoolIdAndCodeStartingWithOrderByCodeDesc(schoolId, prefix, PageRequest.of(0, 1));
            if (!latest.isEmpty()) {
                try {
                    int seq = Integer.parseInt(latest.get(0).getCode().substring(5)) + 1;
                    return prefix + String.format("%04d", seq);
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return prefix + "0001";
    }

    /**
     * 학생 신규 가입 시 알림 발송 대상:
     * 1. SUPER_ADMIN (UserRole.ADMIN 전체)
     * 2. 해당 학교의 STUDENT_MANAGER 또는 SCHOOL_ADMIN 권한 보유자
     */
    private void notifyAdminsOfNewStudent(User student) {
        StudentInfo info = student.getInfo(StudentInfo.class);
        Long schoolId = (info != null && info.getSchool() != null) ? info.getSchool().getId() : null;
        String actionUrl = "/admin/students" + (schoolId != null ? "?schoolId=" + schoolId : "");

        Map<Long, User> recipients = new LinkedHashMap<>();
        userRepository.findAllByRole(UserRole.ADMIN)
                .forEach(u -> recipients.put(u.getUid(), u));

        if (schoolId != null) {
            schoolAdminGrantRepository
                    .findBySchool_IdAndGrantedRoleIn(schoolId,
                            List.of(GrantedRole.SCHOOL_ADMIN, GrantedRole.STUDENT_MANAGER))
                    .stream()
                    .map(SchoolAdminGrant::getUser)
                    .forEach(u -> recipients.putIfAbsent(u.getUid(), u));
        }

        for (User recipient : recipients.values()) {
            NotificationHelper.send(
                    student, recipient,
                    "신규 학생 가입 승인 요청",
                    student.getName() + " 학생이 회원가입을 완료했습니다. 승인 처리를 해주세요.",
                    actionUrl
            );
        }
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
