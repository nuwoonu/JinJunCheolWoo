package com.example.schoolmate.controller;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StaffInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;

@SpringBootTest
public class UserDataTest {
    @Autowired
    private UserRepository userRepository;

    @Test
    @Transactional
    @Rollback(false)
    void createUsersTest() {
        // 1. 학부모 10명 먼저 생성 (학생이 참조해야 하므로)
        List<ParentInfo> parentInfoList = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            User parentUser = User.builder()
                    .email("parent" + i + "@school.com")
                    .name("학부모" + i)
                    .password("1234")
                    .roles(new HashSet<>(Set.of(UserRole.PARENT)))
                    .build();

            ParentInfo parentInfo = new ParentInfo();
            parentInfo.setCode("P" + String.format("%04d", i));
            parentInfo.setEmergencyContact("010-0000-" + String.format("%04d", i));
            parentInfo.setStatus("ACTIVE");
            parentInfo.setUser(parentUser);

            parentUser.getInfos().add(parentInfo);
            userRepository.save(parentUser);
            parentInfoList.add(parentInfo); // 학생 매칭을 위해 리스트에 보관
        }

        // 2. 학생 10명 생성 및 학부모 매칭
        for (int i = 1; i <= 10; i++) {
            User studentUser = User.builder()
                    .email("student" + i + "@school.com")
                    .name("학생" + i)
                    .password("1234")
                    .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
                    .build();

            StudentInfo studentInfo = new StudentInfo();
            studentInfo.setCode("2026" + String.format("%04d", i));
            studentInfo.setGrade(1);
            studentInfo.setClassNum(i % 5 + 1);
            studentInfo.setStatus("ENROLLED");
            studentInfo.setUser(studentUser);

            // 중요: 위에서 생성한 학부모 Info와 연결 (1:1 매칭 예시)
            studentInfo.setParent(parentInfoList.get(i - 1));

            studentUser.getInfos().add(studentInfo);
            userRepository.save(studentUser);
        }

        // 3. 교사 10명 생성 (기존과 동일)
        for (int i = 1; i <= 10; i++) {
            User teacherUser = User.builder()
                    .email("teacher" + i + "@school.com")
                    .name("교사" + i)
                    .password("1234")
                    .roles(new HashSet<>(Set.of(UserRole.TEACHER)))
                    .build();

            TeacherInfo teacherInfo = new TeacherInfo();
            teacherInfo.setCode("T" + String.format("%04d", i));
            teacherInfo.setSubject(i % 2 == 0 ? "수학" : "영어");
            teacherInfo.setDepartment("교무부");
            teacherInfo.setStatus("EMPLOYED");
            teacherInfo.setUser(teacherUser);

            teacherUser.getInfos().add(teacherInfo);
            userRepository.save(teacherUser);
        }

        // 4. 행정직원 10명 생성 (기존과 동일)
        for (int i = 1; i <= 10; i++) {
            User staffUser = User.builder()
                    .email("staff" + i + "@school.com")
                    .name("직원" + i)
                    .password("1234")
                    .roles(new HashSet<>(Set.of(UserRole.STAFF)))
                    .build();

            StaffInfo staffInfo = new StaffInfo();
            staffInfo.setCode("S" + String.format("%04d", i));
            staffInfo.setJobTitle("주무관");
            staffInfo.setStatus("EMPLOYED");
            staffInfo.setUser(staffUser);

            staffUser.getInfos().add(staffInfo);
            userRepository.save(staffUser);
        }
    }
}
