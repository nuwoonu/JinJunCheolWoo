package com.example.schoolmate.service;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.repository.ParentInfoRepository;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.repository.StudentInfoRepository;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.dto.CustomUserDTO;
import com.example.schoolmate.dto.PasswordDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

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
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final ParentInfoRepository parentInfoRepository;
    private final PasswordEncoder passwordEncoder;

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

        return savedUser.getUid();
    }

    // [변경 전] dto에서 학번(studentIdentityNum 또는 studentNumber)을 가져옴
    // 회원가입 폼에서 학번을 입력하지 않으면 null이 되어 DB 저장 시 에러 발생
    // "Column 'code' cannot be null" 에러

    private void createStudentInfo(User user, CustomUserDTO dto) {
        StudentInfo studentInfo = new StudentInfo();
        studentInfo.setUser(user);
        studentInfo.setStatus(StudentStatus.PENDING); // 회원가입 시 승인대기 상태로 설정 [woo]

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

        // ========== [사용하지 않는 코드] 초기 학급 배정 로직 (2025-01-28 woo) ==========
        // 관리자 페이지에서 처리하도록 변경 바뀐 코드: 회원가입을 통해 입력되어 누락된 정보들을 학생,교사,학부모를 admin이 수정할 수
        // 있도록변경.
        // if (dto.getGrade() != null && dto.getClassNum() != null) {
        // int currentYear = LocalDate.now().getYear();
        // StudentAssignment assignment = StudentAssignment.builder()
        // .studentInfo(studentInfo)
        // .schoolYear(currentYear)
        // .grade(dto.getGrade())
        // .classNum(dto.getClassNum())
        // .studentNum(dto.getStudentNum())
        // .build();
        // studentInfo.getAssignments().add(assignment);
        // }

        user.getInfos().add(studentInfo);
    }

    private void createTeacherInfo(User user, CustomUserDTO dto) {
        TeacherInfo teacherInfo = new TeacherInfo();
        teacherInfo.setUser(user);
        teacherInfo.setStatus(TeacherStatus.PENDING); // 회원가입 시 승인대기 상태로 설정 [woo]

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
        parentInfo.setPhoneNumber(dto.getPhoneNumber());
        parentInfo.setStatus(ParentStatus.PENDING); // 회원가입 시 승인대기 상태로 설정 [woo]

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

            int currentYear = LocalDate.now().getYear();
            StudentAssignment assignment = studentInfo.getCurrentAssignment(currentYear);
            if (assignment != null) {
                builder.grade(assignment.getGrade())
                        .classNum(assignment.getClassNum())
                        .studentNum(assignment.getStudentNum())
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
                    .phoneNumber(parentInfo.getPhoneNumber());
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
