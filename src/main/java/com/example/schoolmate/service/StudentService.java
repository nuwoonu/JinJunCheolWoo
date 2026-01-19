package com.example.schoolmate.service;

import com.example.schoolmate.common.entity.Student;
import com.example.schoolmate.common.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 학생 관련 조회 서비스
 * 학생 등록은 UserService.join()을 사용
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class StudentService {

    private final StudentRepository studentRepository;

    /**
     * 전체 학생 목록 조회
     */
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    /**
     * 학생 조회 by ID
     */
    public Student getStudentById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다: " + id));
    }
}
