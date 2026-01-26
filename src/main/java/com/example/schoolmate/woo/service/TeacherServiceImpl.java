package com.example.schoolmate.woo.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.GradeDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.GradeRepository;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.repository.StudentInfoRepository;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.parkjoon.repository.ClassroomRepository;
import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherResponseDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherUpdateDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class TeacherServiceImpl implements TeacherService {

    // 공통 Repository
    private final TeacherInfoRepository teacherRepository;
    private final StudentInfoRepository studentRepository;
    private final ClassroomRepository classroomRepository;

    // cheol 폴더 Repository (연동)
    private final GradeRepository gradeRepository;
    private final SubjectRepository subjectRepository;

    // ========== 교사 정보 ==========

    // 교사 정보 조회
    @Override
    public TeacherResponseDTO getTeacherById(Long id) {
        TeacherInfo teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + id));

        return new TeacherResponseDTO(teacher);
    }

    // 교사 목록 조회
    @Override
    public List<TeacherResponseDTO> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .map(TeacherResponseDTO::new)
                .collect(Collectors.toList());
    }

    // 교사 정보 수정
    @Override
    @Transactional
    public TeacherResponseDTO updateTeacher(Long id, TeacherUpdateDTO updateDTO) {
        TeacherInfo teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + id));

        // null 체크해서 있는 것만 업데이트 (Dirty Checking)
        if (updateDTO.getSubject() != null) {
            teacher.setSubject(updateDTO.getSubject());
        }
        if (updateDTO.getDepartment() != null) {
            teacher.setDepartment(updateDTO.getDepartment());
        }
        if (updateDTO.getPosition() != null) {
            teacher.setPosition(updateDTO.getPosition());
        }
        if (updateDTO.getStatus() != null) {
            teacher.setStatus(updateDTO.getStatus());
        }

        return new TeacherResponseDTO(teacher);
    }

    // ========== 학생 CRUD (교사가 관리) ==========

    @Override
    @Transactional
    public StudentResponseDTO createStudent(StudentCreateDTO createDTO) {
        log.info("학생 등록: {}", createDTO.getStudentNumber());

        // 학번 중복 체크
        if (studentRepository.findByStudentNumber(createDTO.getStudentNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 학번입니다: " + createDTO.getStudentNumber());
        }

        // Classroom 조회
        Classroom classroom = classroomRepository.findById(createDTO.getClassroomId())
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + createDTO.getClassroomId()));

        // Student 엔티티 생성
        StudentInfo student = new StudentInfo();
        student.setStudentNumber(createDTO.getStudentNumber());
        student.setClassroom(classroom);
        student.setBirthDate(createDTO.getBirthDate());
        student.setAddress(createDTO.getAddress());
        student.setPhone(createDTO.getPhone());
        student.setGender(createDTO.getGender());

        StudentInfo savedStudent = studentRepository.save(student);
        return new StudentResponseDTO(savedStudent);
    }

    @Override
    public StudentResponseDTO getStudentById(Long studentId) {
        StudentInfo student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));
        return new StudentResponseDTO(student);
    }

    @Override
    public List<StudentResponseDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(StudentResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StudentResponseDTO updateStudent(Long studentId, StudentUpdateDTO updateDTO) {
        StudentInfo student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        // 업데이트 (Dirty Checking)
        if (updateDTO.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(updateDTO.getClassroomId())
                    .orElseThrow(
                            () -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + updateDTO.getClassroomId()));
            student.setClassroom(classroom);
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

        return new StudentResponseDTO(student);
    }

    @Override
    @Transactional
    public void deleteStudent(Long studentId) {
        StudentInfo student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        // 소프트 삭제 (자퇴 처리)
        student.setStatus(StudentStatus.DROPOUT);
        log.info("학생 삭제(자퇴) 처리: {}", studentId);
    }

    // ========== 담당 학급 조회 ==========

    @Override
    public ClassStudentDTO getMyClassStudents(Long teacherId, int schoolYear) {
        log.info("담당 반 학생 조회 - 교사 ID: {}, 학년도: {}", teacherId, schoolYear);

        // 교사가 담임인 학급 찾기
        Classroom classroom = classroomRepository.findByHomeroomTeacherIdAndYear(teacherId, schoolYear)
                .orElseThrow(() -> new IllegalArgumentException("담당 학급이 없습니다."));

        return buildClassStudentDTO(classroom);
    }

    @Override
    public ClassStudentDTO getClassStudents(int schoolYear, int grade, int classNum) {
        log.info("학급 학생 조회 - {}학년도 {}학년 {}반", schoolYear, grade, classNum);

        Classroom classroom = classroomRepository.findByYearAndGradeAndClassNum(schoolYear, grade, classNum)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));

        return buildClassStudentDTO(classroom);
    }

    // 학급 DTO 만드는 헬퍼 메서드
    private ClassStudentDTO buildClassStudentDTO(Classroom classroom) {
        // 해당 학급 학생들 조회
        List<StudentInfo> students = studentRepository.findByClassroomCid(classroom.getCid());

        List<ClassStudentDTO.StudentSimpleDTO> studentDTOs = students.stream()
                .map(s -> ClassStudentDTO.StudentSimpleDTO.builder()
                        .studentId(s.getId())
                        .name(s.getUser() != null ? s.getUser().getName() : "이름없음")
                        .studentNumber(s.getStudentNumber())
                        .phone(s.getPhone())
                        .email(s.getUser() != null ? s.getUser().getEmail() : null)
                        .build())
                .collect(Collectors.toList());

        // 담임 이름
        String homeroomName = null;
        if (classroom.getHomeroomTeacher() != null && classroom.getHomeroomTeacher().getUser() != null) {
            homeroomName = classroom.getHomeroomTeacher().getUser().getName();
        }

        return ClassStudentDTO.builder()
                .classroomId(classroom.getCid())
                .year(classroom.getYear())
                .grade(classroom.getGrade())
                .classNum(classroom.getClassNum())
                .className(classroom.getClassName())
                .totalStudents(students.size())
                .homeroomTeacherName(homeroomName)
                .students(studentDTOs)
                .build();
    }

    // ========== 성적 입력/수정 (cheol 연동) ==========

    @Override
    @Transactional
    public void inputGrade(Long teacherId, GradeInputDTO gradeDTO) {
        log.info("성적 입력 - 교사: {}, 학생: {}, 과목: {}",
                teacherId, gradeDTO.getStudentId(), gradeDTO.getSubjectCode());

        // 1. 교사 확인
        TeacherInfo teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));

        // 2. 과목 확인
        Subject subject = subjectRepository.findByCode(gradeDTO.getSubjectCode())
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다: " + gradeDTO.getSubjectCode()));

        // 담당 교사 확인 (선택적)
        if (subject.getTeacher() != null && !subject.getTeacher().getId().equals(teacherId)) {
            log.warn("담당 과목이 아닙니다. 교사: {}, 과목 담당: {}", teacherId, subject.getTeacher().getId());
            // throw new IllegalArgumentException("담당 과목이 아닙니다.");
        }

        // 3. 학생 확인
        StudentInfo student = studentRepository.findById(gradeDTO.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        // 4. 성적 생성 (cheol의 Grade 엔티티 사용)
        Grade grade = Grade.builder()
                .student(student)
                .subject(subject)
                .testType(gradeDTO.getTestType())
                .semester(gradeDTO.getSemester())
                .year(gradeDTO.getYear())
                .score(gradeDTO.getScore())
                .build();

        gradeRepository.save(grade);
        log.info("성적 입력 완료 - 학생: {}, 과목: {}, 점수: {}",
                student.getId(), subject.getName(), gradeDTO.getScore());
    }

    @Override
    @Transactional
    public void updateGrade(Long teacherId, Long gradeId, Double newScore) {
        log.info("성적 수정 - 교사: {}, 성적ID: {}, 새점수: {}", teacherId, gradeId, newScore);

        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new IllegalArgumentException("성적을 찾을 수 없습니다."));

        // 점수 수정 (Dirty Checking)
        grade.changeScore(newScore);
    }

    @Override
    public List<GradeDTO> getMySubjectGrades(Long teacherId, String subjectCode) {
        log.info("과목 성적 조회 - 교사: {}, 과목: {}", teacherId, subjectCode);

        List<Grade> grades = gradeRepository.findBySubjectCodeWithSubject(subjectCode);

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<GradeDTO> getStudentGrades(Long studentId) {
        log.info("학생 성적 조회 - 학생 ID: {}", studentId);

        List<Grade> grades = gradeRepository.findByStudentIdWithSubject(studentId);

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // Grade -> GradeDTO 변환
    private GradeDTO entityToDto(Grade grade) {
        return GradeDTO.builder()
                .id(grade.getId())
                .subjectName(grade.getSubject() != null ? grade.getSubject().getName() : null)
                .subjectCode(grade.getSubject() != null ? grade.getSubject().getCode() : null)
                .examType(grade.getTestType())
                .score(grade.getScore())
                .semester(grade.getSemester())
                .year(grade.getYear())
                .build();
    }
}
