package com.example.schoolmate.common.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.CustomUserDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional(readOnly = true)
public class CustomUserDetailsService implements UserDetailsService {

        private final UserRepository userRepository;

        @Override
        public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
                log.info("로그인 시도: {}", email);

                // 1. DB에서 이메일로 유저 찾기
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

                log.info("사용자 정보 로드: {}, 역할: {}", user.getEmail(), user.getRoles());

                // 2. User Entity를 CustomUserDTO로 변환
                CustomUserDTO customUserDTO = entityToDTO(user);

                // 3. AuthUserDTO로 감싸서 반환 (Spring Security가 사용)
                return new AuthUserDTO(customUserDTO);
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
                                .roles(user.getRoles())
                                .build();

                // 주요 역할 설정 (하위 호환)
                if (!user.getRoles().isEmpty()) {
                        dto.setRole(getPrimaryRole(user));
                }

                // StudentInfo가 있으면 학생 정보 추가
                StudentInfo studentInfo = user.getInfo(StudentInfo.class);
                if (studentInfo != null) {
                        dto.setStudentInfoId(studentInfo.getId()); // StudentInfo의 PK
                        dto.setStudentIdentityNum(studentInfo.getCode());
                        dto.setStudentNumber(studentInfo.getCode()); // 하위 호환

                        StudentAssignment assignment = studentInfo.getCurrentAssignment();
                        if (assignment != null) {
                                dto.setSchoolYear(assignment.getSchoolYear());
                                dto.setGrade(assignment.getGrade());
                                dto.setClassNum(assignment.getClassNum());
                                dto.setStudentNum(assignment.getAttendanceNum());
                        }
                }

                // TeacherInfo가 있으면 교사 정보 추가
                TeacherInfo teacherInfo = user.getInfo(TeacherInfo.class);
                if (teacherInfo != null) {
                        dto.setSubject(teacherInfo.getSubject());
                        dto.setDepartment(teacherInfo.getDepartment());
                        dto.setPosition(teacherInfo.getPosition());
                        dto.setEmployeeNumber(teacherInfo.getCode());
                }

                // ParentInfo가 있으면 학부모 정보 추가
                ParentInfo parentInfo = user.getInfo(ParentInfo.class);
                if (parentInfo != null) {
                        dto.setPhoneNumber(parentInfo.getPhone());
                }

                return dto;
        }

        /**
         * 주요 역할 결정 (우선순위: ADMIN > TEACHER > PARENT > STUDENT)
         */
        private UserRole getPrimaryRole(User user) {
                if (user.getRoles().contains(UserRole.ADMIN))
                        return UserRole.ADMIN;
                if (user.getRoles().contains(UserRole.TEACHER))
                        return UserRole.TEACHER;
                if (user.getRoles().contains(UserRole.PARENT))
                        return UserRole.PARENT;
                if (user.getRoles().contains(UserRole.STUDENT))
                        return UserRole.STUDENT;
                return user.getRoles().iterator().next();
        }
}