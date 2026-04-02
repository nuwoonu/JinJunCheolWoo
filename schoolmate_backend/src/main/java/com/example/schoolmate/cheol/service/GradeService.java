package com.example.schoolmate.cheol.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.GradeDTO;
import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.repository.GradeRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class GradeService {
    private final GradeRepository gradeRepository;
    private final StudentInfoRepository studentInfoRepository;

    // 전체 성적 조회
    public List<GradeDTO> getAllGrades() {
        log.info("전체 성적 조회");

        List<Grade> grades = gradeRepository.findAllWithSubject();

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // 학기별 성적 조회 (AcademicTerm ID 기반)
    public List<GradeDTO> getGradesByAcademicTerm(Long academicTermId) {
        log.info("학기별 성적 조회 - academicTermId: {}", academicTermId);

        List<Grade> grades = gradeRepository.findByAcademicTermWithSubject(academicTermId);

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // 과목별 성적 조회
    public List<GradeDTO> getGradesBySubjectCode(String subjectCode) {
        log.info("과목별 성적 조회 - 과목 코드: {}", subjectCode);

        List<Grade> grades = gradeRepository.findBySubjectCodeWithSubject(subjectCode);

        if (grades.isEmpty()) {
            log.warn("과목 코드 {}에 해당하는 성적이 없습니다.", subjectCode);
        }

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // 학생별 성적 조회
    public List<GradeDTO> getGradesByStudentId(Long studentId) {
        log.info("학생별 성적 조회 - 학생 ID: {}", studentId);

        if (!studentInfoRepository.existsById(studentId)) {
            throw new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentId);
        }

        List<Grade> grades = gradeRepository.findByStudentIdWithSubject(studentId);

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // 학생의 특정 학기 성적 조회
    public List<GradeDTO> getGradesByStudentAndAcademicTerm(Long studentId, Long academicTermId) {
        log.info("학생의 학기별 성적 조회 - 학생 ID: {}, academicTermId: {}", studentId, academicTermId);

        if (!studentInfoRepository.existsById(studentId)) {
            throw new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentId);
        }

        List<Grade> grades = gradeRepository.findByStudentIdAndAcademicTermWithSubject(
                studentId, academicTermId);

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // entity to dto
    private GradeDTO entityToDto(Grade grade) {
        GradeDTO.GradeDTOBuilder builder = GradeDTO.builder()
                .id(grade.getId())
                .studentId(grade.getStudent() != null ? grade.getStudent().getId() : null)
                .subjectName(grade.getSubject() != null ? grade.getSubject().getName() : null)
                .subjectCode(grade.getSubject() != null ? grade.getSubject().getCode() : null)
                .examType(grade.getTestType())
                .score(grade.getScore() != null ? grade.getScore().doubleValue() : null);

        if (grade.getAcademicTerm() != null) {
            builder.academicTermId(grade.getAcademicTerm().getId())
                    .schoolYear(grade.getAcademicTerm().getSchoolYear())
                    .semester(grade.getAcademicTerm().getSemester())
                    .termDisplayName(grade.getAcademicTerm().getDisplayName());
        }

        return builder.build();
    }
}
