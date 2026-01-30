package com.example.schoolmate.cheol.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.GradeDTO;
import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.repository.GradeRepository;
import com.example.schoolmate.common.entity.user.constant.Year;
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

    // 학기/학년별 성적 조회
    public List<GradeDTO> getGradesBySemesterAndYear(int semester, Year year) {
        log.info("학기/학년별 성적 조회 - 학기: {}, 학년: {}", semester, year);

        // 입력 검증
        if (semester < 1 || semester > 2) {
            throw new IllegalArgumentException("학기는 1 또는 2만 가능합니다.");
        }

        // Subject를 Fetch Join으로 한 번에 가져옴
        List<Grade> grades = gradeRepository.findBySemesterAndYearWithSubject(semester, year);

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

        // 학생 존재 여부 확인
        if (!studentInfoRepository.existsById(studentId)) {
            throw new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentId);
        }

        List<Grade> grades = gradeRepository.findByStudentIdWithSubject(studentId);

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // 학생의 특정 학기/ 학년 성적 조회
    public List<GradeDTO> getGradesByStudentAndSemesterAndYear(Long studentId, int semester, Year year) {
        log.info("학생의 학기/학년별 성적 조회 - 학생 ID: {}, 학기: {}, 학년: {}", studentId, semester, year);

        // 입력 검증
        if (semester < 1 || semester > 2) {
            throw new IllegalArgumentException("학기는 1 또는 2만 가능합니다.");
        }

        if (!studentInfoRepository.existsById(studentId)) {
            throw new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentId);
        }

        List<Grade> grades = gradeRepository.findByStudentIdAndSemesterAndYearWithSubject(
                studentId, semester, year);

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    // entity to dto
    private GradeDTO entityToDto(Grade grade) {
        return GradeDTO.builder()
                .id(grade.getId())
                .subjectName(grade.getSubject() != null ? grade.getSubject().getName() : null)
                .subjectCode(grade.getSubject() != null ? grade.getSubject().getCode() : null)
                .examType(grade.getTestType())
                .score(grade.getScore() != null ? grade.getScore().doubleValue() : null)
                .semester(grade.getSemester())
                .year(grade.getYear())
                .build();
    }

}