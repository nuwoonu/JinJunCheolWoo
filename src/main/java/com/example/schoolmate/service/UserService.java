package com.example.schoolmate.service;

import com.example.schoolmate.common.entity.AdminEntity;
import com.example.schoolmate.common.entity.Parent;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.entity.Student;
import com.example.schoolmate.common.entity.Teacher;
import com.example.schoolmate.common.entity.User;
import com.example.schoolmate.common.entity.constant.UserRole;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.CustomUserDTO;
import com.example.schoolmate.dto.PasswordDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Spring Security UserDetailsService 구현 - 로그인 시 사용자 정보 로드
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("로그인 시도: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

        log.info("사용자 정보 로드: {}, 역할: {}", user.getEmail(), user.getRole());

        // User Entity를 CustomUserDTO로 변환
        CustomUserDTO customUserDTO = entityToDTO(user);

        // AuthUserDTO로 감싸서 반환 (Spring Security가 사용)
        return new AuthUserDTO(customUserDTO);
    }

    /**
     * 회원가입 - 역할별 사용자 생성
     */
    public Long join(CustomUserDTO dto) {
        log.info("회원가입 시도: {}, 역할: {}", dto.getEmail(), dto.getRole());

        // 이메일 중복 체크
        if (existsByEmail(dto.getEmail())) {
            throw new IllegalStateException("이미 사용중인 이메일입니다: " + dto.getEmail());
        }

        User user;

        // 역할에 따라 적절한 Entity 생성
        switch (dto.getRole()) {
            case STUDENT:
                Student student = new Student();
                student.changeEmail(dto.getEmail());
                student.changePassword(passwordEncoder.encode(dto.getPassword()));
                student.changeName(dto.getName());
                student.changeRole(UserRole.STUDENT);
                student.changeStudentNumber(dto.getStudentNumber());
                student.changeGrade(dto.getGrade());
                student.changeClassNum(dto.getClassNum());
                user = student;
                break;

            case TEACHER:
                Teacher teacher = new Teacher();
                teacher.changeEmail(dto.getEmail());
                teacher.changePassword(passwordEncoder.encode(dto.getPassword()));
                teacher.changeName(dto.getName());
                teacher.changeRole(UserRole.TEACHER);
                teacher.changeEmployeeNumber(dto.getEmployeeNumber());
                teacher.changeSubject(dto.getSubject());
                user = teacher;
                break;

            case ADMIN:
                AdminEntity admin = new AdminEntity();
                admin.changeEmail(dto.getEmail());
                admin.changePassword(passwordEncoder.encode(dto.getPassword()));
                admin.changeName(dto.getName());
                admin.changeRole(UserRole.ADMIN);
                admin.changeEmployeeNumber(dto.getEmployeeNumber());
                admin.changeDepartment(dto.getDepartment());
                user = admin;
                break;

            default:
                throw new IllegalArgumentException("지원하지 않는 역할입니다: " + dto.getRole());
        }

        User savedUser = userRepository.save(user);
        log.info("회원가입 완료: {}, ID: {}", savedUser.getEmail(), savedUser.getUid());

        return savedUser.getUid();
    }

    /**
     * 비밀번호 변경
     */
    public void changePassword(PasswordDTO dto) throws IllegalStateException {
        log.info("비밀번호 변경 시도: {}", dto.getEmail());

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("회원정보를 찾을 수 없습니다."));

        // 현재 비밀번호 확인
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

        // 비밀번호 확인
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalStateException("비밀번호가 일치하지 않습니다.");
        }

        // 1. 프로필 이미지 삭제
        Optional<Profile> profile = profileRepository.findByUser(user);
        profile.ifPresent(profileRepository::delete);
        log.info("프로필 삭제 완료: {}", dto.getEmail());

        // 2. 학부모인 경우 - 자녀와의 연결 해제 (자녀는 삭제하지 않음)
        if (user instanceof Parent) {
            Parent parent = (Parent) user;
            for (Student child : parent.getChildren()) {
                child.changeParent(null);
            }
            parent.getChildren().clear();
            log.info("자녀 연결 해제 완료: {}", dto.getEmail());
        }

        // 3. 학생인 경우 - 부모와의 연결 해제
        if (user instanceof Student) {
            Student student = (Student) user;
            student.changeParent(null);
        }

        // 4. 사용자 삭제
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
     * User Entity를 CustomUserDTO로 변환
     */
    private CustomUserDTO entityToDTO(User user) {
        CustomUserDTO dto = CustomUserDTO.builder()
                .uid(user.getUid())
                .email(user.getEmail())
                .password(user.getPassword())
                .name(user.getName())
                .role(user.getRole())
                .build();

        // 역할별 추가 정보 설정
        if (user instanceof Student) {
            Student student = (Student) user;
            dto.setStudentNumber(student.getStudentNumber());
            dto.setGrade(student.getGrade());
            dto.setClassNum(student.getClassNum());
        } else if (user instanceof Teacher) {
            Teacher teacher = (Teacher) user;
            dto.setEmployeeNumber(teacher.getEmployeeNumber());
            dto.setSubject(teacher.getSubject());
        } else if (user instanceof AdminEntity) {
            AdminEntity admin = (AdminEntity) user;
            dto.setEmployeeNumber(admin.getEmployeeNumber());
            dto.setDepartment(admin.getDepartment());
        }

        return dto;
    }

    /**
     * 이메일로 CustomUserDTO 조회
     */
    @Transactional(readOnly = true)
    public CustomUserDTO getUserDTOByEmail(String email) {
        User user = getUserByEmail(email);
        return entityToDTO(user);
    }
}
