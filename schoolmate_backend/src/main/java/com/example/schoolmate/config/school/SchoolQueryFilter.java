package com.example.schoolmate.config.school;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.NumberPath;

/**
 * QueryDSL 공통 학교 스코프 필터 유틸리티.
 *
 * <p>각 RepositoryImpl에서 동일하게 복붙되던 schoolFilter() 로직을 한 곳에서 관리합니다.
 * SchoolContextHolder에서 현재 요청의 학교 ID를 읽어 BooleanExpression을 생성하며,
 * schoolId가 없으면 null을 반환하여 QueryDSL where 절에서 자동으로 무시됩니다.</p>
 *
 * <h3>사용 예시</h3>
 * <pre>
 *   // 기존 (각 RepositoryImpl마다 복붙)
 *   private BooleanExpression schoolFilter(QTeacherInfo info) {
 *       Long schoolId = SchoolContextHolder.getSchoolId();
 *       if (schoolId == null) return null;
 *       return info.school.id.eq(schoolId);
 *   }
 *
 *   // 변경 후
 *   SchoolQueryFilter.schoolIdEq(info.school.id)
 * </pre>
 */
public final class SchoolQueryFilter {

    private SchoolQueryFilter() {}

    /**
     * 표준 학교 스코프 필터.
     * entity.school.id = currentSchoolId
     *
     * @param schoolIdPath Q엔티티의 school.id 경로 (예: info.school.id)
     */
    public static BooleanExpression schoolIdEq(NumberPath<Long> schoolIdPath) {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) return null;
        return schoolIdPath.eq(schoolId);
    }

    /**
     * 학부모 목록용 학교 스코프 필터.
     * 학부모(ParentInfo)는 school_id가 없으므로 자녀(StudentInfo)의 학교를 기준으로 필터링합니다.
     * 자녀가 없는 학부모도 목록에 포함시키기 위해 childId IS NULL OR childSchoolId = currentSchoolId 조건을 사용합니다.
     *
     * @param childIdPath        자녀 StudentInfo의 id 경로 (예: student.id)
     * @param childSchoolIdPath  자녀 StudentInfo의 school.id 경로 (예: student.school.id)
     */
    public static BooleanExpression childSchoolIdEqOrNoChild(
            NumberPath<Long> childIdPath,
            NumberPath<Long> childSchoolIdPath) {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) return null;
        return childIdPath.isNull().or(childSchoolIdPath.eq(schoolId));
    }
}
