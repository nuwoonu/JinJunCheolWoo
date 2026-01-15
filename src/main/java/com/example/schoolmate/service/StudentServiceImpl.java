package com.example.schoolmate.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.Student;
import com.example.schoolmate.common.entity.constant.Status;
import com.example.schoolmate.common.entity.constant.UserRole;
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
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public StudentResponseDTO createStudent(StudentCreateDTO createDTO) {
        // 이메일 중복 체크
        if (studentRepository.findByEmail(createDTO.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + createDTO.getEmail());
        }

        // 학번 중복 체크
        if (studentRepository.findByStudentNumber(createDTO.getStudentNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 학번입니다: " + createDTO.getStudentNumber());
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(createDTO.getPassword());

        // Student 엔티티 생성
        Student student = Student.builder()
                .studentNumber(createDTO.getStudentNumber())
                .grade(createDTO.getGrade())
                .classNum(createDTO.getClassNum())
                .name(createDTO.getName())
                .email(createDTO.getEmail())
                .password(encodedPassword)
                .birthDate(createDTO.getBirthDate())
                .address(createDTO.getAddress())
                .phone(createDTO.getPhone())
                .gender(createDTO.getGender())
                .status(createDTO.getStatus() != null ? createDTO.getStatus() : Status.ACTIVE)
                .role(UserRole.STUDENT)
                .build();

        Student savedStudent = studentRepository.save(student);
        return convertToResponseDTO(savedStudent);
    }

    @Override
    public StudentResponseDTO getStudentByUid(Long uid) {
        Student student = studentRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid));
        return convertToResponseDTO(student);
    }

    @Override
    public StudentResponseDTO getStudentByStudentNumber(Long studentNumber) {
        Student student = studentRepository.findByStudentNumber(studentNumber)
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
        Student student = studentRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid));

        // 이메일 변경 시 중복 체크
        if (updateDTO.getEmail() != null && !updateDTO.getEmail().equals(student.getEmail())) {
            if (studentRepository.findByEmail(updateDTO.getEmail()).isPresent()) {
                throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + updateDTO.getEmail());
            }
        }

        // 업데이트 가능한 필드만 변경
        Student updatedStudent = Student.builder()
                .uid(student.getUid())
                .studentNumber(student.getStudentNumber()) // 학번은 변경 불가
                .grade(updateDTO.getGrade() != null ? updateDTO.getGrade() : student.getGrade())
                .classNum(updateDTO.getClassNum() != null ? updateDTO.getClassNum() : student.getClassNum())
                .name(updateDTO.getName() != null ? updateDTO.getName() : student.getName())
                .email(updateDTO.getEmail() != null ? updateDTO.getEmail() : student.getEmail())
                .password(updateDTO.getPassword() != null ? passwordEncoder.encode(updateDTO.getPassword())
                        : student.getPassword())
                .birthDate(updateDTO.getBirthDate() != null ? updateDTO.getBirthDate() : student.getBirthDate())
                .address(updateDTO.getAddress() != null ? updateDTO.getAddress() : student.getAddress())
                .phone(updateDTO.getPhone() != null ? updateDTO.getPhone() : student.getPhone())
                .gender(updateDTO.getGender() != null ? updateDTO.getGender() : student.getGender())
                .status(updateDTO.getStatus() != null ? updateDTO.getStatus() : student.getStatus())
                .role(student.getRole())
                .build();

        Student savedStudent = studentRepository.save(updatedStudent);
        return convertToResponseDTO(savedStudent);
    }

    @Override
    @Transactional
    public void deleteStudent(Long uid) {
        Student student = studentRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. UID: " + uid));

        // 소프트 삭제 - status를 INACTIVE로 변경
        Student updatedStudent = Student.builder()
                .uid(student.getUid())
                .studentNumber(student.getStudentNumber())
                .grade(student.getGrade())
                .classNum(student.getClassNum())
                .name(student.getName())
                .email(student.getEmail())
                .password(student.getPassword())
                .birthDate(student.getBirthDate())
                .address(student.getAddress())
                .phone(student.getPhone())
                .gender(student.getGender())
                .status(Status.INACTIVE)
                .role(student.getRole())
                .build();

        studentRepository.save(updatedStudent);
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
    private StudentResponseDTO convertToResponseDTO(Student student) {
        return StudentResponseDTO.builder()
                .uid(student.getUid())
                .email(student.getEmail())
                .name(student.getName())
                .role(student.getRole())
                .studentNumber(student.getStudentNumber())
                .grade(student.getGrade())
                .classNum(student.getClassNum())
                .fullStudentNumber(student.getFullStudentNumber())
                .birthDate(student.getBirthDate())
                .address(student.getAddress())
                .phone(student.getPhone())
                .gender(student.getGender())
                .status(student.getStatus())
                .createdDate(student.getCreateDateTime())
                .modifiedDate(student.getUpdateDateTime())
                .build();
    }
}
