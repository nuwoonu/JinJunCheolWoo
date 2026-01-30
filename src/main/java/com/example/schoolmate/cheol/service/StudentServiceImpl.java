package com.example.schoolmate.cheol.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.repository.ClassroomRepository;
import com.example.schoolmate.common.repository.StudentInfoRepository;
import com.example.schoolmate.common.entity.Classroom;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentServiceImpl {

    private final StudentInfoRepository studentRepository;
    private final ClassroomRepository classroomRepository;

    @Transactional
    public StudentResponseDTO createStudent(StudentCreateDTO createDTO) {
        // 학번 중복 체크
        if (studentRepository.findByStudentNumber(createDTO.getStudentNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 학번입니다: " + createDTO.getStudentNumber());
        }

        // Classroom 조회
        Classroom classroom = classroomRepository.findById(createDTO.getClassroomId())
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + createDTO.getClassroomId()));

        // Student 엔티티 생성 (Setter 방식)
        StudentInfo student = new StudentInfo();
        student.setStudentNumber(createDTO.getStudentNumber());
        student.setClassroom(classroom);
        student.setBirthDate(createDTO.getBirthDate());
        student.setAddress(createDTO.getAddress());
        student.setPhone(createDTO.getPhone());
        student.setGender(createDTO.getGender());

        StudentInfo savedStudent = studentRepository.save(student);
        return convertToResponseDTO(savedStudent);
    }

    public StudentResponseDTO getStudentById(Long id) {
        StudentInfo student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + id));
        return convertToResponseDTO(student);
    }

    public StudentResponseDTO getStudentByStudentNumber(Long studentNumber) {
        StudentInfo student = studentRepository.findByStudentNumber(studentNumber)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. 학번: " + studentNumber));
        return convertToResponseDTO(student);
    }

    public List<StudentResponseDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<StudentResponseDTO> getStudentsByGrade(int grade) {
        return studentRepository.findByClassroomGrade(grade).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<StudentResponseDTO> getStudentsByClassNum(int classNum) {
        return studentRepository.findByClassroomClassNum(classNum).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<StudentResponseDTO> getStudentsByGradeAndClass(int grade, int classNum) {
        return studentRepository.findByClassroomGradeAndClassroomClassNum(grade, classNum).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudentResponseDTO updateStudent(Long id, StudentUpdateDTO updateDTO) {
        StudentInfo student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + id));

        // 업데이트 가능한 필드만 변경 (Dirty Checking 활용)
        if (updateDTO.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(updateDTO.getClassroomId())
                    .orElseThrow(
                            () -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + updateDTO.getClassroomId()));
            student.setClassroom(classroom);
        }
        if (updateDTO.getId() != null) {
            student.setId(updateDTO.getId());
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

    @Transactional
    public void deleteStudent(Long id) {
        StudentInfo student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + id));

        // 소프트 삭제 - Dirty Checking 활용
        student.setStatus(StudentStatus.DROPOUT);
    }

    @Transactional
    public void permanentDeleteStudent(Long uid) {
        if (!studentRepository.existsById(uid)) {
            throw new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid);
        }
        studentRepository.deleteById(uid);
    }

    // entity to dto (정적 팩토리 메서드 사용)
    private StudentResponseDTO convertToResponseDTO(StudentInfo student) {
        return StudentResponseDTO.from(student);
    }

}
