package com.example.schoolmate.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.parkjoon.repository.ClassroomRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassService {

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ClassDTO.DetailResponse> getClassList() {
        return classroomRepository.findAll().stream()
                .map(c -> ClassDTO.DetailResponse.from(c, 0)) // 학생 수는 목록에서 0으로 처리하거나 별도 조회
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClassDTO.TeacherSelectResponse> getTeacherList() {
        TeacherDTO.TeacherSearchCondition cond = new TeacherDTO.TeacherSearchCondition();
        cond.setStatus("EMPLOYED");
        return userRepository.searchTeachers(cond, Pageable.unpaged()).stream()
                .map(ClassDTO.TeacherSelectResponse::from)
                .collect(Collectors.toList());
    }

    public void createClass(ClassDTO.CreateRequest request) {
        // 중복 확인
        boolean exists = classroomRepository.existsByYearAndGradeAndClassNum(
                request.getYear(), request.getGrade(), request.getClassNum());
        if (exists) {
            throw new IllegalArgumentException("이미 존재하는 학급입니다.");
        }

        Classroom classroom = new Classroom();
        classroom.setYear(request.getYear());
        classroom.setGrade(request.getGrade());
        classroom.setClassNum(request.getClassNum());

        if (request.getTeacherUid() != null) {
            User teacher = userRepository.findById(request.getTeacherUid())
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            classroom.setTeacher(teacher);
        }

        classroomRepository.save(classroom);
    }

    public void assignTeacher(ClassDTO.UpdateRequest request) {
        Classroom classroom = classroomRepository.findById(request.getCid())
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        if (request.getTeacherUid() != null) {
            User teacher = userRepository.findById(request.getTeacherUid())
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            classroom.setTeacher(teacher);
        } else {
            classroom.setTeacher(null);
        }
    }
}