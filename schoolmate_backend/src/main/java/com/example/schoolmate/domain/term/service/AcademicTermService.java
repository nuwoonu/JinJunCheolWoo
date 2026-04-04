package com.example.schoolmate.domain.term.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.AcademicTermStatus;
import com.example.schoolmate.domain.term.entity.SchoolYear;
import com.example.schoolmate.domain.term.entity.SchoolYearStatus;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;
import com.example.schoolmate.domain.term.repository.SchoolYearRepository;

import lombok.RequiredArgsConstructor;

/**
 * 학기(학사 기간) 관리 서비스
 *
 * SystemSetting의 currentSchoolYear / currentSemester 역할을 대체합니다.
 * - 현재 활성 학기 조회: status = ACTIVE인 AcademicTerm
 * - 학기 전환: 기존 ACTIVE → CLOSED, 신규 AcademicTerm ACTIVE로 생성
 * - 과거 학기 기록은 CLOSED 상태로 영구 보존됩니다.
 *
 * 학년도 전환 시 SchoolYear 상태(CURRENT/PAST)도 함께 관리합니다.
 */
@Service
@RequiredArgsConstructor
public class AcademicTermService {

    private final AcademicTermRepository academicTermRepository;
    private final SchoolYearRepository schoolYearRepository;
    private final SchoolRepository schoolRepository;

    /**
     * 현재 학교의 활성 학기 조회
     * 없으면 기본값(현재 연도, 1학기)을 반환합니다. (DB 저장 안 함)
     */
    @Transactional(readOnly = true)
    public AcademicTerm getCurrentTerm() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) {
            return defaultTerm();
        }
        return academicTermRepository
                .findBySchoolIdAndStatus(schoolId, AcademicTermStatus.ACTIVE)
                .orElseGet(this::defaultTerm);
    }

    /**
     * 특정 학교의 활성 학기 조회 (schoolId 직접 전달)
     */
    @Transactional(readOnly = true)
    public AcademicTerm getCurrentTerm(Long schoolId) {
        return academicTermRepository
                .findBySchoolIdAndStatus(schoolId, AcademicTermStatus.ACTIVE)
                .orElseGet(this::defaultTerm);
    }

    /**
     * 새 학기 개설 및 활성화
     * - 기존 활성 학기를 CLOSED 처리합니다.
     * - 학년도가 바뀌는 경우 이전 SchoolYear를 PAST로, 새 SchoolYear를 CURRENT로 전환합니다.
     * - 이미 동일 학년도·학기가 존재하면 해당 학기를 ACTIVE로 전환합니다.
     */
    @Transactional
    public AcademicTerm openTerm(int year, int semester, LocalDate startDate, LocalDate endDate) {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) {
            throw new IllegalStateException("학교 컨텍스트가 없습니다.");
        }

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("학교를 찾을 수 없습니다."));

        // 기존 활성 학기 종료
        academicTermRepository.findBySchoolIdAndStatus(schoolId, AcademicTermStatus.ACTIVE)
                .ifPresent(existing -> existing.setStatus(AcademicTermStatus.CLOSED));

        // SchoolYear 처리: 학년도가 바뀌면 기존 CURRENT → PAST, 신규 학년도 CURRENT 설정
        schoolYearRepository.findBySchoolIdAndStatus(schoolId, SchoolYearStatus.CURRENT)
                .ifPresent(current -> {
                    if (current.getYear() != year) {
                        current.setStatus(SchoolYearStatus.PAST);
                    }
                });

        SchoolYear schoolYear = schoolYearRepository.findBySchoolIdAndYear(schoolId, year)
                .orElseGet(() -> {
                    SchoolYear sy = new SchoolYear(year, SchoolYearStatus.CURRENT);
                    sy.setSchool(school);
                    return sy;
                });
        schoolYear.setStatus(SchoolYearStatus.CURRENT);
        schoolYear = schoolYearRepository.save(schoolYear);

        // 동일 학년도·학기가 이미 존재하면 재활성화
        final SchoolYear finalSchoolYear = schoolYear;
        AcademicTerm term = academicTermRepository
                .findBySchoolIdAndSchoolYear_YearAndSemester(schoolId, year, semester)
                .orElseGet(() -> {
                    AcademicTerm newTerm = new AcademicTerm(finalSchoolYear, semester, startDate,
                            endDate, AcademicTermStatus.ACTIVE);
                    newTerm.setSchool(school);
                    return newTerm;
                });

        term.setSchoolYear(finalSchoolYear);
        term.setStatus(AcademicTermStatus.ACTIVE);
        term.setStartDate(startDate);
        term.setEndDate(endDate);
        return academicTermRepository.save(term);
    }

    /**
     * 특정 학기 종료 처리
     */
    @Transactional
    public void closeTerm(Long termId) {
        AcademicTerm term = academicTermRepository.findById(termId)
                .orElseThrow(() -> new IllegalArgumentException("학기를 찾을 수 없습니다. id=" + termId));
        term.setStatus(AcademicTermStatus.CLOSED);
    }

    /**
     * 현재 학교의 전체 학기 이력 조회 (최신순)
     */
    @Transactional(readOnly = true)
    public List<AcademicTerm> getTermHistory() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) return List.of();
        return academicTermRepository.findBySchoolIdOrderBySchoolYear_YearDescSemesterDesc(schoolId);
    }

    /**
     * 특정 학년도·학기 조회
     */
    @Transactional(readOnly = true)
    public AcademicTerm getTerm(int year, int semester) {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) throw new IllegalStateException("학교 컨텍스트가 없습니다.");
        return academicTermRepository
                .findBySchoolIdAndSchoolYear_YearAndSemester(schoolId, year, semester)
                .orElseThrow(() -> new IllegalArgumentException(
                        year + "학년도 " + semester + "학기 정보가 없습니다."));
    }

    // ── 하위 호환: SystemSettingService 대체 용도 ──────────────────────────

    /** 현재 학년도 반환 (기존 SystemSettingService.getCurrentSchoolYear() 대체) */
    @Transactional(readOnly = true)
    public int getCurrentSchoolYear() {
        AcademicTerm term = getCurrentTerm();
        return term.getSchoolYear() != null ? term.getSchoolYear().getYear() : LocalDate.now().getYear();
    }

    /** 현재 학기 반환 (기존 SystemSettingService.getCurrentSemester() 대체) */
    @Transactional(readOnly = true)
    public int getCurrentSemester() {
        return getCurrentTerm().getSemester();
    }

    // ── 내부 유틸 ────────────────────────────────────────────────────────────

    private AcademicTerm defaultTerm() {
        AcademicTerm term = new AcademicTerm();
        // schoolYear은 null로 유지 (비영속 기본값)
        term.setSemester(1);
        term.setStatus(AcademicTermStatus.ACTIVE);
        return term;
    }
}
