package com.example.schoolmate.common.service;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.cheol.dto.SubjectDTO;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.opencsv.bean.CsvToBeanBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 관리자 교과목 관리 서비스
 *
 * 교과목(Subject) 데이터에 대한 CRUD 비즈니스 로직을 담당합니다.
 * 학년 구분은 과목 코드 네이밍 컨벤션으로 처리합니다. (예: MATH01 = 1학년 수학)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubjectService {

    private final SubjectRepository subjectRepository;

    @Transactional(readOnly = true)
    public List<SubjectDTO.Response> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(SubjectDTO.Response::from)
                .collect(Collectors.toList());
    }

    public void createSubject(SubjectDTO.Request request) {
        if (subjectRepository.existsById(request.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 과목 코드입니다: " + request.getCode());
        }
        if (subjectRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("이미 존재하는 과목명입니다: " + request.getName());
        }
        subjectRepository.save(Subject.builder()
                .code(request.getCode())
                .name(request.getName())
                .build());
    }

    public void updateSubject(SubjectDTO.Request request) {
        Subject subject = subjectRepository.findById(request.getOriginCode())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과목입니다: " + request.getOriginCode()));

        // 코드가 변경된 경우 PK 변경이므로 삭제 후 재생성
        if (!request.getOriginCode().equals(request.getCode())) {
            if (subjectRepository.existsById(request.getCode())) {
                throw new IllegalArgumentException("이미 존재하는 과목 코드입니다: " + request.getCode());
            }
            subjectRepository.delete(subject);
            subjectRepository.save(Subject.builder()
                    .code(request.getCode())
                    .name(request.getName())
                    .build());
        } else {
            subjectRepository.save(Subject.builder()
                    .code(request.getCode())
                    .name(request.getName())
                    .build());
        }
    }

    public void deleteSubject(String code) {
        subjectRepository.deleteById(code);
    }

    /**
     * CSV 파일로 과목 일괄 등록
     *
     * CSV 형식 (헤더 필수): 코드,과목명
     * - 이미 존재하는 코드는 건너뜁니다.
     *
     * @return 처리 결과 메시지 목록 (등록/건너뜀/실패 구분)
     */
    public List<String> importFromCsv(MultipartFile file) throws Exception {
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
                    if (subjectRepository.existsById(code)) {
                        log.warn("과목 코드 중복 건너뜀: {}", code);
                        results.add("건너뜀(중복): " + code);
                        continue;
                    }
                    subjectRepository.save(Subject.builder()
                            .code(code)
                            .name(row.getName().trim())
                            .build());
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
