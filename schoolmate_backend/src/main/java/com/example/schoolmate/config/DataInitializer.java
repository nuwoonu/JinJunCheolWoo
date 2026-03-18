package com.example.schoolmate.config;

import java.util.HashSet;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.school.service.NeisService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SchoolRepository schoolRepository;
    private final NeisService neisService;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        createAdminAccountIfNotExists();
        syncSchoolDataIfEmpty();
    }

    private void createAdminAccountIfNotExists() {
        String adminEmail = "admin@school.com";
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            return;
        }

        User adminUser = User.builder()
                .email(adminEmail)
                .name("최고관리자")
                .password(passwordEncoder.encode("1234"))
                .roles(new HashSet<>(Set.of(UserRole.ADMIN)))
                .build();

        userRepository.save(adminUser);
        log.info("초기 관리자 계정이 자동 생성되었습니다. ID: {}", adminEmail);
    }

    private void syncSchoolDataIfEmpty() {
        if (schoolRepository.count() == 0) {
            log.info("학교 데이터가 없어 NEIS 동기화를 시작합니다.");
            neisService.syncSchoolData("DataInitializer");
        }
    }
}