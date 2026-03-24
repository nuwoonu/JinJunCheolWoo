package com.example.schoolmate.common.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

/**
 * @deprecated AcademicTerm 으로 대체되었습니다.
 * 현재 학기 조회: AcademicTermService.getCurrentTerm()
 * 학기 관리:     AdminSettingApiController (/admin/settings)
 *
 * 기존 데이터 마이그레이션 완료 전까지 테이블은 유지됩니다.
 */
@Deprecated
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSetting extends SchoolBaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** @deprecated AcademicTerm.schoolYear 사용 */
    @Deprecated
    private int currentSchoolYear;

    /** @deprecated AcademicTerm.semester 사용 */
    @Deprecated
    private int currentSemester; // 1 or 2
}