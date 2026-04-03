package com.example.schoolmate.cheol.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.CocurricularActivitiesDTO;
import com.example.schoolmate.cheol.dto.CocurricularActivitiesRequestDTO;
import com.example.schoolmate.cheol.entity.CocurricularActivities;
import com.example.schoolmate.cheol.repository.CocurricularActivitiesRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

// [cheol] 창의적 체험활동 Service
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class CocurricularActivitiesService {

    private final CocurricularActivitiesRepository cocurricularActivitiesRepository;
    private final StudentInfoRepository studentInfoRepository;

    // 학생별 전체 조회
    public List<CocurricularActivitiesDTO> getByStudentId(Long studentId) {
        log.info("창의적 체험활동 조회 - 학생 ID: {}", studentId);

        if (!studentInfoRepository.existsById(studentId)) {
            throw new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentId);
        }

        return cocurricularActivitiesRepository.findByStudentId(studentId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // 등록 또는 수정 (학년+카테고리 기준 upsert)
    @Transactional
    public CocurricularActivitiesDTO save(Long studentId, CocurricularActivitiesRequestDTO request) {
        log.info("창의적 체험활동 저장 - 학생 ID: {}, 학년: {}, 카테고리: {}", studentId, request.getYear(), request.getCategory());

        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentId));

        CocurricularActivities record = cocurricularActivitiesRepository
                .findByStudentIdAndYearAndCategory(studentId, request.getYear(), request.getCategory())
                .map(existing -> {
                    existing.update(request.getSpecifics());
                    return existing;
                })
                .orElseGet(() -> CocurricularActivities.builder()
                        .student(student)
                        .year(request.getYear())
                        .category(request.getCategory())
                        .specifics(request.getSpecifics())
                        .build());

        return toDto(cocurricularActivitiesRepository.save(record));
    }

    private CocurricularActivitiesDTO toDto(CocurricularActivities c) {
        return CocurricularActivitiesDTO.builder()
                .id(c.getId())
                .studentId(c.getStudent() != null ? c.getStudent().getId() : null)
                .year(c.getYear())
                .category(c.getCategory())
                .specifics(c.getSpecifics())
                .build();
    }
}
