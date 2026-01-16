package com.example.schoolmate.controller;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StaffInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;

@SpringBootTest
public class UserDataTest {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    // @Test
    // @Transactional
    // @Rollback(false)
    // void createUsersTest() {
    // // 1. 학부모 10명 생성
    // List<ParentInfo> parentInfoList = new ArrayList<>();
    // for (int i = 1; i <= 10; i++) {
    // User parentUser = User.builder()
    // .email("parent" + i + "@school.com")
    // .name("학부모" + i)
    // .password("1234")
    // .roles(new HashSet<>(Set.of(UserRole.PARENT)))
    // .build();

    // ParentInfo parentInfo = new ParentInfo();
    // parentInfo.setCode("P" + String.format("%04d", i));
    // parentInfo.setEmergencyContact("010-0000-" + String.format("%04d", i));
    // // ParentStatus Enum이 있다면 적용 (없다면 String 유지 가능)
    // parentInfo.setStatus(ParentStatus.ACTIVE);
    // parentInfo.setUser(parentUser);

    // parentUser.getInfos().add(parentInfo);
    // userRepository.save(parentUser);
    // parentInfoList.add(parentInfo);
    // }

    // // // 2. 학생 10명 생성 및 학부모 매칭
    // // for (int i = 1; i <= 10; i++) {
    // // User studentUser = User.builder()
    // // .email("student" + i + "@school.com")
    // // .name("학생" + i)
    // // .password("1234")
    // // .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
    // // .build();

    // // StudentInfo studentInfo = new StudentInfo();
    // // studentInfo.setCode("2026" + String.format("%04d", i));
    // // studentInfo.setGrade(1);
    // // studentInfo.setClassNum(i % 5 + 1);
    // // // StudentStatus Enum 적용
    // // studentInfo.setStatus(StudentStatus.ENROLLED);
    // // studentInfo.setUser(studentUser);
    // // studentInfo.setParent(parentInfoList.get(i - 1));

    // // studentUser.getInfos().add(studentInfo);
    // // userRepository.save(studentUser);
    // // }

    // // 3. 교사 10명 생성
    // for (int i = 1; i <= 10; i++) {
    // User teacherUser = User.builder()
    // .email("teacher" + i + "@school.com")
    // .name("교사" + i)
    // .password("1234")
    // .roles(new HashSet<>(Set.of(UserRole.TEACHER)))
    // .build();

    // TeacherInfo teacherInfo = new TeacherInfo();
    // teacherInfo.setCode("T" + String.format("%04d", i));
    // teacherInfo.setSubject(i % 2 == 0 ? "수학" : "영어");
    // teacherInfo.setDepartment("교무부");
    // // TeacherStatus Enum 적용
    // teacherInfo.setStatus(TeacherStatus.EMPLOYED);
    // teacherInfo.setUser(teacherUser);

    // teacherUser.getInfos().add(teacherInfo);
    // userRepository.save(teacherUser);
    // }

    // // 4. 행정직원 10명 생성
    // for (int i = 1; i <= 10; i++) {
    // User staffUser = User.builder()
    // .email("staff" + i + "@school.com")
    // .name("직원" + i)
    // .password("1234")
    // .roles(new HashSet<>(Set.of(UserRole.STAFF)))
    // .build();

    // StaffInfo staffInfo = new StaffInfo();
    // staffInfo.setCode("S" + String.format("%04d", i));
    // staffInfo.setJobTitle("주무관");
    // // StaffStatus Enum 적용
    // staffInfo.setStatus(StaffStatus.EMPLOYED);
    // staffInfo.setUser(staffUser);

    // staffUser.getInfos().add(staffInfo);
    // userRepository.save(staffUser);
    // }
    // }

    @Test
    @Transactional
    @Rollback(false) // DB에 실제로 반영하기 위해 false 설정
    void createAdminAccount() {
        // 1. 이미 해당 이메일의 어드민이 있는지 확인 (중복 방지)
        String adminEmail = "admin@school.com";
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            System.out.println("이미 관리자 계정이 존재합니다.");
            return;
        }

        // 2. 관리자 유저 엔티티 생성
        User adminUser = User.builder()
                .email(adminEmail)
                .name("최고관리자")
                // 비밀번호를 암호화하여 저장 (로그인 시 '1234' 입력)
                .password(passwordEncoder.encode("1234"))
                .roles(new HashSet<>(Set.of(UserRole.ADMIN)))
                .build();
        // 4. DB 저장
        userRepository.save(adminUser);

        System.out.println("관리자 계정 생성 완료: " + adminEmail);
    }
}
