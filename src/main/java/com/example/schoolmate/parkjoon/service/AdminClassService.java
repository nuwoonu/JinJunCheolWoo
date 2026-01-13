package com.example.schoolmate.parkjoon.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.parkjoon.entity.Classroom;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.parkjoon.repository.ClassroomRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminClassService {

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository; // TeacherRepository 대신 UserRepository 사용 권장

    public void createClassroom(int year, int grade, int classNum) {
        Classroom classroom = Classroom.builder()
                .year(year)
                .grade(grade)
                .classNum(classNum)
                .build();
        classroomRepository.save(classroom);
    }

    public void assignTeacher(Long classroomId, Long teacherUid) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 학급이 없습니다."));

        // User 엔티티를 찾아서 담임으로 지정
        User teacher = userRepository.findById(teacherUid)
                .orElseThrow(() -> new IllegalArgumentException("해당 교사 계정이 없습니다."));

        // 유효성 검사 (선택 사항): 이 유저가 진짜 교사 권한을 가졌는지 확인
        if (!teacher.hasRole(UserRole.TEACHER)) {
            throw new IllegalStateException("교사 권한이 없는 사용자입니다.");
        }

        classroom.setTeacher(teacher);
    }
}