package com.example.schoolmate.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.Parent;
import com.example.schoolmate.common.entity.Staff;
import com.example.schoolmate.common.entity.Student;
import com.example.schoolmate.common.entity.Teacher;
import com.example.schoolmate.common.entity.constant.UserRole;
import com.example.schoolmate.common.repository.ParentRepository;
import com.example.schoolmate.common.repository.StaffRepository;
import com.example.schoolmate.common.repository.StudentRepository;
import com.example.schoolmate.common.repository.TeacherRepository;

@SpringBootTest
public class UserDataTest {

    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private TeacherRepository teacherRepository;
    @Autowired
    private ParentRepository parentRepository;
    @Autowired
    private StaffRepository staffRepository;

    @Test
    @Transactional
    @Rollback(false) // 테스트 후 데이터가 지워지지 않고 DB에 남도록 설정
    void createUsersTest() {
        // 1. 학생 생성
        Student student = new Student();
        student.setEmail("student@school.com");
        student.setName("김학생");
        student.setPassword("1234");
        student.setStudentNumber("20240001");
        student.setGrade(1);
        student.setClassNum(3);
        student.setRole(UserRole.STUDENT);
        studentRepository.save(student);

        // 2. 교사 생성
        Teacher teacher = new Teacher();
        teacher.setEmail("teacher@school.com");
        teacher.setName("이교사");
        teacher.setPassword("1234");
        teacher.setSubject("수학");
        teacher.setEmployeeNumber("T1004");
        teacher.setRole(UserRole.TEACHER);
        teacherRepository.save(teacher);

        // 3. 학부모 생성
        Parent parent = new Parent();
        parent.setEmail("parent@school.com");
        parent.setName("박학부모");
        parent.setPassword("1234");
        parent.setPhoneNumber("010-1234-5678");
        parent.setEmergencyContact("010-9999-8888");
        parent.setRole(UserRole.PARENT);
        parentRepository.save(parent);

        // 4. 교직원 생성
        Staff staff = new Staff();
        staff.setEmail("staff@school.com");
        staff.setName("최교직");
        staff.setPassword("1234");
        staff.setDepartment("행정실");
        staff.setPosition("실장");
        staff.setRole(UserRole.STAFF);
        staffRepository.save(staff);
    }
}
