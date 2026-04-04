package com.example.schoolmate.domain.grade.service;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.domain.grade.dto.SubjectDTO;
import com.example.schoolmate.domain.grade.entity.Subject;
import com.example.schoolmate.domain.grade.repository.SubjectRepository;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.opencsv.bean.CsvToBeanBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 관리자 교과목 관리 서비스
 *
 * 교과목(Subject) 데이터에 대한 CRUD 비즈니스 로직을 담당합니다.
 * 학교별로 분리하여 관리합니다 (X-School-Id 헤더 기반).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final SchoolRepository schoolRepository;

    @Transactional(readOnly = true)
    public List<SubjectDTO.Response> getAllSubjects() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        List<Subject> list = (schoolId != null)
                ? subjectRepository.findAllBySchool_Id(schoolId)
                : subjectRepository.findAll();
        return list.stream().map(SubjectDTO.Response::from).collect(Collectors.toList());
    }

    public void createSubject(SubjectDTO.Request request) {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId != null) {
            if (subjectRepository.existsByCodeAndSchool_Id(request.getCode(), schoolId)) {
                throw new IllegalArgumentException("이미 존재하는 과목 코드입니다: " + request.getCode());
            }
            if (subjectRepository.existsByNameAndSchool_Id(request.getName(), schoolId)) {
                throw new IllegalArgumentException("이미 존재하는 과목명입니다: " + request.getName());
            }
        } else {
            if (subjectRepository.existsByCode(request.getCode())) {
                throw new IllegalArgumentException("이미 존재하는 과목 코드입니다: " + request.getCode());
            }
            if (subjectRepository.existsByName(request.getName())) {
                throw new IllegalArgumentException("이미 존재하는 과목명입니다: " + request.getName());
            }
        }
        Subject subject = Subject.builder()
                .code(request.getCode())
                .name(request.getName())
                .build();
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(subject::setSchool);
        }
        subjectRepository.save(subject);
    }

    public void updateSubject(SubjectDTO.Request request) {
        Subject subject = subjectRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과목입니다."));

        Long schoolId = SchoolContextHolder.getSchoolId();

        // 코드가 변경된 경우 중복 체크
        if (!request.getCode().equals(subject.getCode())) {
            boolean codeExists = (schoolId != null)
                    ? subjectRepository.existsByCodeAndSchool_Id(request.getCode(), schoolId)
                    : subjectRepository.existsByCode(request.getCode());
            if (codeExists) {
                throw new IllegalArgumentException("이미 존재하는 과목 코드입니다: " + request.getCode());
            }
        }

        // 삭제 후 재생성 (school 유지)
        School school = subject.getSchool();
        subjectRepository.delete(subject);
        subjectRepository.flush();

        Subject updated = Subject.builder()
                .code(request.getCode())
                .name(request.getName())
                .build();
        if (school != null) {
            updated.setSchool(school);
        } else if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(updated::setSchool);
        }
        subjectRepository.save(updated);
    }

    public void deleteSubject(Long id) {
        subjectRepository.deleteById(id);
    }

    /**
     * CSV 파일로 과목 일괄 등록
     *
     * CSV 형식 (헤더 필수): 코드,과목명
     * - 이미 존재하는 코드(학교 범위 내)는 건너뜁니다.
     *
     * @return 처리 결과 메시지 목록 (등록/건너뜀/실패 구분)
     */
    public List<String> importFromCsv(MultipartFile file) throws Exception {
        Long schoolId = SchoolContextHolder.getSchoolId();
        School school = (schoolId != null) ? schoolRepository.findById(schoolId).orElse(null) : null;

        List<String> results = new ArrayList<>();
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            List<SubjectDTO.CsvRow> rows = new CsvToBeanBuilder<SubjectDTO.CsvRow>(reader)
                    .withType(SubjectDTO.CsvRow.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();

            for (SubjectDTO.CsvRow row : rows) {
                if (row.getCode() == null || row.getCode().isBlank()) continue;
                String code = row.getCode().trim().toUpperCase();
                try {
                    boolean isDuplicate = (schoolId != null)
                            ? subjectRepository.existsByCodeAndSchool_Id(code, schoolId)
                            : subjectRepository.existsByCode(code);
                    if (isDuplicate) {
                        log.warn("과목 코드 중복 건너뜀: {}", code);
                        results.add("건너뜀(중복): " + code);
                        continue;
                    }
                    Subject subject = Subject.builder()
                            .code(code)
                            .name(row.getName().trim())
                            .build();
                    if (school != null) {
                        subject.setSchool(school);
                    }
                    subjectRepository.save(subject);
                    log.info("과목 등록: {} - {}", code, row.getName());
                    results.add("등록: " + code + " (" + row.getName() + ")");
                } catch (Exception e) {
                    log.error("과목 등록 실패 ({}): {}", code, e.getMessage());
                    results.add("실패(" + code + "): " + e.getMessage());
                }
            }
        }
        return results;
    }
}
