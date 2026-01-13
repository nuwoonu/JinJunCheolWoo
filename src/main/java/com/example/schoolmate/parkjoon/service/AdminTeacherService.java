package com.example.schoolmate.parkjoon.service;

import java.util.HashSet;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminTeacherService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // Security 설정 필요

    public void createTeacher(TeacherDTO.CreateRequest request) {
        // 1. 유저 기본 정보 생성
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // 암호화
                .roles(new HashSet<>(Set.of(UserRole.TEACHER)))
                .build();

        // 2. 교사 상세 정보 생성
        TeacherInfo info = new TeacherInfo();
        info.setSubject(request.getSubject());
        info.setDepartment(request.getDepartment());
        info.setPosition(request.getPosition());
        info.setStatus(TeacherStatus.EMPLOYED); // 초기값: 재직
        info.setUser(user);

        // 3. 연관관계 설정
        user.getInfos().add(info);

        // 4. 저장 (Cascade 옵션 덕분에 User만 저장해도 Info가 함께 저장됨)
        userRepository.save(user);
    }
}
