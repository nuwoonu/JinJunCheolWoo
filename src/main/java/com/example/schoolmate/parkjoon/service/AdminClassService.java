package com.example.schoolmate.parkjoon.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.repository.TeacherRepository;
import com.example.schoolmate.parkjoon.entity.Classroom;
import com.example.schoolmate.common.entity.Teacher;
import com.example.schoolmate.parkjoon.repository.ClassroomRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminClassService {

    private final ClassroomRepository classroomRepository;
    private final TeacherRepository teacherRepository;

    /**
     * 신규 학급 생성
     */
    public void createClassroom(int year, int grade, int classNum) {
        Classroom classroom = Classroom.builder()
                .year(year)
                .grade(grade)
                .classNum(classNum)
                .build();
        classroomRepository.save(classroom);
    }

    /**
     * 특정 학급에 담임 교사 배정
     */
    public void assignTeacher(Long classroomId, Long teacherUid) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("해당 학급이 없습니다."));

        Teacher teacher = teacherRepository.findById(teacherUid)
                .orElseThrow(() -> new IllegalArgumentException("해당 교사가 없습니다."));

        classroom.setTeacher(teacher);
        // Dirty Checking으로 자동 업데이트
    }
}