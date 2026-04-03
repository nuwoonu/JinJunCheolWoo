package com.example.schoolmate.cheol.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.BehaviorRecordDTO;
import com.example.schoolmate.cheol.dto.BehaviorRecordRequestDTO;
import com.example.schoolmate.cheol.entity.BehaviorRecord;
import com.example.schoolmate.cheol.repository.BehaviorRecordRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

// [cheol] 행동 특성 및 종합의견 Service
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class BehaviorRecordService {

    private final BehaviorRecordRepository behaviorRecordRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final AcademicTermRepository academicTermRepository;

    // 학생별 전체 조회
    public List<BehaviorRecordDTO> getByStudentId(Long studentId) {
        log.info("행동 특성 조회 - 학생 ID: {}", studentId);

        if (!studentInfoRepository.existsById(studentId)) {
            throw new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentId);
        }

        return behaviorRecordRepository.findByStudentId(studentId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // 등록 또는 수정 (학년도+학기 기준 upsert)
    @Transactional
    public BehaviorRecordDTO save(Long studentId, BehaviorRecordRequestDTO request) {
        log.info("행동 특성 저장 - 학생 ID: {}, 학년도: {}, 학기: {}", studentId, request.getSchoolYear(), request.getSemester());

        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentId));

        Long schoolId = student.getSchool().getId();
        AcademicTerm academicTerm = academicTermRepository
                .findBySchoolIdAndSchoolYear_YearAndSemester(schoolId, request.getSchoolYear(), request.getSemester())
                .orElseThrow(() -> new IllegalArgumentException(
                        request.getSchoolYear() + "학년도 " + request.getSemester() + "학기 학기 정보를 찾을 수 없습니다."));

        BehaviorRecord record = behaviorRecordRepository
                .findByStudentIdAndYearAndSemester(studentId, request.getSchoolYear(), request.getSemester())
                .map(existing -> {
                    existing.update(request.getSpecialNotes());
                    return existing;
                })
                .orElseGet(() -> BehaviorRecord.builder()
                        .student(student)
                        .academicTerm(academicTerm)
                        .specialNotes(request.getSpecialNotes())
                        .build());

        return toDto(behaviorRecordRepository.save(record));
    }

    private BehaviorRecordDTO toDto(BehaviorRecord b) {
        return BehaviorRecordDTO.builder()
                .id(b.getId())
                .studentId(b.getStudent() != null ? b.getStudent().getId() : null)
                .schoolYear(b.getSchoolYearInt())
                .semester(b.getSemester())
                .specialNotes(b.getSpecialNotes())
                .build();
    }
}
