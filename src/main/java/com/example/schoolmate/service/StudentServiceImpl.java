package com.example.schoolmate.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.repository.StudentRepository;
import com.example.schoolmate.studentdto.StudentCreateDTO;
import com.example.schoolmate.studentdto.StudentResponseDTO;
import com.example.schoolmate.studentdto.StudentUpdateDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;

    @Override
    @Transactional
    public StudentResponseDTO createStudent(StudentCreateDTO createDTO) {
        // 학번 중복 체크
        if (studentRepository.findByStudentNumber(createDTO.getStudentNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 학번입니다: " + createDTO.getStudentNumber());
        }

        // Student 엔티티 생성 (Setter 방식)
        StudentInfo student = new StudentInfo();
        student.setStudentNumber(createDTO.getStudentNumber());
        student.setGrade(createDTO.getGrade());
        student.setClassNum(createDTO.getClassNum());
        student.setBirthDate(createDTO.getBirthDate());
        student.setAddress(createDTO.getAddress());
        student.setPhone(createDTO.getPhone());
        student.setGender(createDTO.getGender());

        StudentInfo savedStudent = studentRepository.save(student);
        return convertToResponseDTO(savedStudent);
    }

    @Override
    public StudentResponseDTO getStudentByUid(Long uid) {
        StudentInfo student = studentRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid));
        return convertToResponseDTO(student);
    }

    @Override
    public StudentResponseDTO getStudentByStudentNumber(Long studentNumber) {
        StudentInfo student = studentRepository.findByStudentNumber(studentNumber)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. 학번: " + studentNumber));
        return convertToResponseDTO(student);
    }

    @Override
    public List<StudentResponseDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudentResponseDTO> getStudentsByGrade(int grade) {
        return studentRepository.findByGrade(grade).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudentResponseDTO> getStudentsByClassNum(int classNum) {
        return studentRepository.findByClassNum(classNum).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudentResponseDTO> getStudentsByGradeAndClass(int grade, int classNum) {
        return studentRepository.findAll().stream()
                .filter(student -> student.getGrade() == grade && student.getClassNum() == classNum)
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StudentResponseDTO updateStudent(Long uid, StudentUpdateDTO updateDTO) {
        StudentInfo student = studentRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid));

        // 업데이트 가능한 필드만 변경 (Dirty Checking 활용)
        if (updateDTO.getGrade() != null) {
            student.setGrade(updateDTO.getGrade());
        }
        if (updateDTO.getClassNum() != null) {
            student.setClassNum(updateDTO.getClassNum());
        }
        if (updateDTO.getBirthDate() != null) {
            student.setBirthDate(updateDTO.getBirthDate());
        }
        if (updateDTO.getAddress() != null) {
            student.setAddress(updateDTO.getAddress());
        }
        if (updateDTO.getPhone() != null) {
            student.setPhone(updateDTO.getPhone());
        }
        if (updateDTO.getGender() != null) {
            student.setGender(updateDTO.getGender());
        }

        // @Transactional로 인해 변경 감지되어 자동 저장됨
        return convertToResponseDTO(student);
    }

    @Override
    @Transactional
    public void deleteStudent(Long uid) {
        StudentInfo student = studentRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid));

        // 소프트 삭제 - Dirty Checking 활용
        student.setStatus(StudentStatus.DROPOUT);
    }

    @Override
    @Transactional
    public void permanentDeleteStudent(Long uid) {
        if (!studentRepository.existsById(uid)) {
            throw new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid);
        }
        studentRepository.deleteById(uid);
    }

    // entity to dto
    private StudentResponseDTO convertToResponseDTO(StudentInfo student) {
        return new StudentResponseDTO(student);
    }
}
