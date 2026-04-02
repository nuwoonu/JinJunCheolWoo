package com.example.schoolmate.woo.service;

import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.GradeRepository;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.common.repository.info.TeacherStudentRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.GradeResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// [woo] 교사 성적 입력/조회 서비스
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherGradeService {

    private final GradeRepository gradeRepository;
    private final SubjectRepository subjectRepository;
    private final ClassroomRepository classroomRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final TeacherStudentRepository teacherStudentRepository;

    // [woo] 교사의 접근 가능한 학급 목록 (담임반 + 담당 학생 학급 합집합)
    public List<ClassStudentDTO> getAccessibleClassrooms(Long teacherInfoId) {
        Map<Long, Classroom> classroomMap = new LinkedHashMap<>();

        // 1. 담임 학급
        classroomRepository.findByHomeroomTeacherId(teacherInfoId)
                .forEach(c -> classroomMap.put(c.getCid(), c));

        // 2. 담당 학생의 학급 (TeacherStudent 기반)
        teacherStudentRepository.findClassroomsByTeacherInfoId(teacherInfoId)
                .forEach(c -> classroomMap.putIfAbsent(c.getCid(), c));

        return classroomMap.values().stream()
                .map(c -> {
                    int studentCount = studentInfoRepository.findByCurrentClassroomId(c.getCid()).size();
                    return ClassStudentDTO.builder()
                            .classroomId(c.getCid())
                            .schoolId(c.getSchool() != null ? c.getSchool().getId() : null)
                            .year(c.getYear())
                            .grade(c.getGrade())
                            .classNum(c.getClassNum())
                            .className(c.getClassName())
                            .totalStudents(studentCount)
                            .homeroomTeacherName(
                                c.getHomeroomTeacher() != null
                                    ? c.getHomeroomTeacher().getUser().getName()
                                    : null)
                            .students(List.of())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // [woo] 학급+과목+학기+학년도 기준 성적 목록 (학생별 testType별)
    public List<GradeResponseDTO> getGradesByClassroomAndSubject(
            Long classroomId, Long subjectId, Semester semester, int schoolYear) {

        List<Grade> grades = gradeRepository.findByClassroomAndSubjectAndSemester(
                classroomId, subjectId, semester);

        return grades.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    // [woo] 성적 입력 (upsert: student+subject+testType+semester 기준)
    @Transactional
    public GradeResponseDTO inputGrade(GradeInputDTO dto, Long teacherInfoId) {
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다."));
        StudentInfo student = studentInfoRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        TeacherInfo teacher = teacherInfoRepository.findById(teacherInfoId)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        // upsert: 동일한 학생+과목+시험종류+학기 조합 확인
        List<Grade> existing = gradeRepository.findByStudentAndSubjectAndSemesterAndTestType(
                dto.getStudentId(), dto.getSubjectId(), dto.getSemester(), dto.getTestType());

        Grade grade;
        if (!existing.isEmpty()) {
            grade = existing.get(0);
            grade.changeScore(dto.getScore());
        } else {
            grade = Grade.builder()
                    .student(student)
                    .subject(subject)
                    .testType(dto.getTestType())
                    .semester(dto.getSemester())
                    .score(dto.getScore())
                    .inputTeacher(teacher)
                    .build();
            gradeRepository.save(grade);
        }

        return toResponseDTO(grade);
    }

    // [woo] 성적 수정
    @Transactional
    public GradeResponseDTO updateGrade(Long gradeId, Double score, Long teacherInfoId) {
        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new IllegalArgumentException("성적을 찾을 수 없습니다."));
        if (score < 0 || score > 100) {
            throw new IllegalArgumentException("점수는 0~100 사이여야 합니다.");
        }
        grade.changeScore(score);
        return toResponseDTO(grade);
    }

    // [woo] 성적 삭제
    @Transactional
    public void deleteGrade(Long gradeId, Long teacherInfoId) {
        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new IllegalArgumentException("성적을 찾을 수 없습니다."));
        gradeRepository.delete(grade);
    }

    private GradeResponseDTO toResponseDTO(Grade grade) {
        StudentAssignment sa = grade.getStudent().getCurrentAssignment();
        return GradeResponseDTO.builder()
                .id(grade.getId())
                .studentId(grade.getStudent().getId())
                .studentName(grade.getStudent().getUser().getName())
                .attendanceNum(sa != null ? sa.getAttendanceNum() : null)
                .subjectId(grade.getSubject().getId())
                .subjectCode(grade.getSubject().getCode())
                .subjectName(grade.getSubject().getName())
                .testType(grade.getTestType())
                .score(grade.getScore())
                .semester(grade.getSemester())
                .schoolYear(sa != null ? sa.getSchoolYear() : 0)
                .inputTeacherName(grade.getInputTeacher() != null
                        ? grade.getInputTeacher().getUser().getName() : null)
                .build();
    }
}
