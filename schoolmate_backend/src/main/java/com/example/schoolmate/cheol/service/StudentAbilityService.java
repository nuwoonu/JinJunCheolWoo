package com.example.schoolmate.cheol.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.studentabilitydto.StudentAbilityRequestDTO;
import com.example.schoolmate.cheol.dto.studentabilitydto.StudentAbilityResponseDTO;
import com.example.schoolmate.cheol.entity.StudentAbility;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.StudentAbilityRepository;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.AcademicTermStatus;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class StudentAbilityService {

    private final StudentAbilityRepository studentAbilityRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final SubjectRepository subjectRepository;
    private final AcademicTermRepository academicTermRepository;
    private final SchoolRepository schoolRepository;

    private Long getRequiredSchoolId() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) throw new IllegalStateException("학교 컨텍스트가 없습니다.");
        return schoolId;
    }

    /**
     * 세부능력 저장/수정 (현재 ACTIVE 학기 기준 upsert)
     */
    @Transactional
    public StudentAbilityResponseDTO save(StudentAbilityRequestDTO request) {
        Long schoolId = getRequiredSchoolId();

        StudentInfo student = studentInfoRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다."));

        Subject subject = subjectRepository.findByCodeAndSchool_Id(request.getSubjectCode(), schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과목입니다: " + request.getSubjectCode()));

        AcademicTerm activeTerm = academicTermRepository
                .findBySchoolIdAndStatus(schoolId, AcademicTermStatus.ACTIVE)
                .orElseThrow(() -> new IllegalStateException("현재 활성 학기가 없습니다."));

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학교입니다."));

        StudentAbility ability = studentAbilityRepository
                .findByStudentAndSubjectAndTerm(student.getId(), subject.getCode(), activeTerm.getId())
                .orElseGet(() -> StudentAbility.builder()
                        .studentInfo(student)
                        .subject(subject)
                        .academicTerm(activeTerm)
                        .school(school)
                        .content("")
                        .build());

        ability.updateContent(request.getContent());
        StudentAbility saved = studentAbilityRepository.save(ability);

        log.info("세부능력 저장: 학생={}, 과목={}, 학기={}",
                student.getUser().getName(), subject.getName(), activeTerm.getDisplayName());

        return StudentAbilityResponseDTO.from(saved);
    }

    /**
     * 학생의 전체 세부능력 조회
     */
    public List<StudentAbilityResponseDTO> getByStudentId(Long studentId) {
        return studentAbilityRepository.findByStudentInfoId(studentId).stream()
                .map(StudentAbilityResponseDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * 학생 + 과목 코드 + 현재 ACTIVE 학기 기준 단건 조회 (모달 pre-fill용)
     */
    public Optional<StudentAbilityResponseDTO> getByStudentAndSubject(Long studentId, String subjectCode) {
        Long schoolId = getRequiredSchoolId();
        return academicTermRepository.findBySchoolIdAndStatus(schoolId, AcademicTermStatus.ACTIVE)
                .flatMap(term -> studentAbilityRepository
                        .findByStudentAndSubjectAndTerm(studentId, subjectCode, term.getId()))
                .map(StudentAbilityResponseDTO::from);
    }
}
