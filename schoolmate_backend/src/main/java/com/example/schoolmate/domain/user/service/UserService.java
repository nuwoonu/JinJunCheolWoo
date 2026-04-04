package com.example.schoolmate.domain.user.service;
import com.example.schoolmate.domain.school.service.CodeSequenceService;

import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.UserRole;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.staff.entity.StaffInfo;
import com.example.schoolmate.domain.parent.entity.ParentInfo;
import com.example.schoolmate.domain.student.entity.constant.StudentStatus;
import com.example.schoolmate.domain.teacher.entity.constant.TeacherStatus;
import com.example.schoolmate.domain.staff.entity.constant.StaffStatus;
import com.example.schoolmate.domain.student.entity.StudentAssignment;
import com.example.schoolmate.domain.user.entity.Profile;
import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.user.entity.RoleRequest;
import com.example.schoolmate.domain.user.entity.SchoolAdminGrant;
import com.example.schoolmate.domain.user.entity.constant.GrantedRole;
import com.example.schoolmate.domain.user.repository.SchoolAdminGrantRepository;
import com.example.schoolmate.domain.user.repository.ProfileRepository;
import com.example.schoolmate.domain.user.repository.RoleRequestRepository;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.domain.classroom.repository.ClassroomRepository;
import com.example.schoolmate.domain.term.entity.SchoolYearStatus;
import com.example.schoolmate.domain.term.repository.SchoolYearRepository;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.global.util.NotificationHelper;
import com.example.schoolmate.domain.user.dto.CustomUserDTO;
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
    private final RoleRequestRepository roleRequestRepository;
    private final SchoolAdminGrantRepository schoolAdminGrantRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClassroomRepository classroomRepository;
    private final SchoolRepository schoolRepository;
    private final CodeSequenceService codeSequenceService;
    private final SchoolYearRepository schoolYearRepository;

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

        // processRoleSetup 내부의 existsBy 쿼리가 User 객체를 파라미터로 사용하므로
        // uid가 없는 transient 상태로 넘기면 TransientObjectException 발생.
        // 먼저 저장해 uid를 확보한 뒤 호출한다.
        userRepository.save(user);

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
        // 1. 중복 신청 방지 (ADMIN 제외) — Info 생성 전에 체크하여 중복 INSERT 방지
        if (role != UserRole.ADMIN) {
            boolean alreadyExists = schoolId != null
                    ? roleRequestRepository.existsByUserAndRoleAndSchoolId(user, role, schoolId)
                    : roleRequestRepository.existsByUserAndRoleAndSchoolIdIsNull(user, role);
            if (alreadyExists) return;
        }

        // 2. 역할별 Info 엔티티 생성 (ADMIN은 Info 없음)
        switch (role) {
            case STUDENT -> buildStudentInfo(user, schoolId, dto);
            case TEACHER -> buildTeacherInfo(user, schoolId, dto);
            case STAFF   -> buildStaffInfo(user, schoolId, dto);
            case PARENT  -> buildParentInfo(user, schoolId, dto);
            case ADMIN   -> { /* Info 없음 */ }
            default -> throw new IllegalArgumentException("지원하지 않는 역할입니다: " + role);
        }

        // 3. 저장 (cascade로 Info도 함께 저장)
        userRepository.save(user);

        if (role == UserRole.ADMIN) return;

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

        // 학번: dto에서 가져오거나 S+연도+4자리 순번으로 자동 채번 (예: S20260001)
        String code = (dto != null) ? dto.getStudentIdentityNum() : null;
        info.setCode((code != null && !code.isEmpty()) ? code : codeSequenceService.issue(schoolId, "S"));

        if (dto != null) {
            info.setPhone(dto.getPhoneNumber());
            // 학급 배정 (이메일 가입 시 학년·반 정보가 있을 때만)
            if (dto.getGrade() != null && dto.getClassNum() != null) {
                Long ctxSchoolId = SchoolContextHolder.getSchoolId();
                schoolYearRepository.findBySchoolIdAndStatus(ctxSchoolId, SchoolYearStatus.CURRENT).ifPresent(currentSchoolYear -> {
                    classroomRepository
                            .findBySchoolIdAndSchoolYear_YearAndGradeAndClassNum(ctxSchoolId, currentSchoolYear.getYear(), dto.getGrade(), dto.getClassNum())
                            .ifPresent(classroom -> {
                                StudentAssignment assignment = StudentAssignment.builder()
                                        .studentInfo(info)
                                        .schoolYear(currentSchoolYear)
                                        .classroom(classroom)
                                        .attendanceNum(dto.getStudentNum())
                                        .build();
                                info.getAssignments().add(assignment);
                            });
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

        // 사번: dto에서 가져오거나 T+연도+4자리 순번으로 자동 채번 (예: T20260001)
        String code = (dto != null) ? dto.getEmployeeNumber() : null;
        info.setCode((code != null && !code.isEmpty()) ? code : codeSequenceService.issue(schoolId, "T"));

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

        // 학부모 코드: P+연도+4자리 순번 전역 채번 (예: P20260001)
        info.setCode(codeSequenceService.issue(null, "P"));

        user.getInfos().add(info);
    }

    private void buildStaffInfo(User user, Long schoolId, CustomUserDTO dto) {
        boolean isFirst = user.getInfos().stream().noneMatch(i -> i instanceof StaffInfo);
        StaffInfo info = new StaffInfo();
        info.setUser(user);
        info.setStatus(StaffStatus.EMPLOYED);
        info.setPrimary(isFirst);
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(info::setSchool);
        }

        // 교직원 코드: E+연도+4자리 순번으로 자동 채번 (예: E20260001)
        info.setCode(codeSequenceService.issue(schoolId, "E"));

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
                        .schoolYear(assignment.getSchoolYearInt());
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
