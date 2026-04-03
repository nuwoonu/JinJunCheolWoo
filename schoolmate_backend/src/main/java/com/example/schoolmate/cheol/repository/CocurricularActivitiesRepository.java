package com.example.schoolmate.cheol.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.cheol.entity.CocurricularActivities;
import com.example.schoolmate.common.entity.user.constant.ActivityCategory;
import com.example.schoolmate.common.entity.user.constant.Year;

// [cheol] 창의적 체험활동 Repository
public interface CocurricularActivitiesRepository extends JpaRepository<CocurricularActivities, Long> {

    // 학생별 전체 조회
    @Query("SELECT c FROM CocurricularActivities c WHERE c.student.id = :studentId ORDER BY c.year, c.category")
    List<CocurricularActivities> findByStudentId(@Param("studentId") Long studentId);

    // 학생 + 학년 + 카테고리 단건 조회
    @Query("SELECT c FROM CocurricularActivities c WHERE c.student.id = :studentId AND c.year = :year AND c.category = :category")
    Optional<CocurricularActivities> findByStudentIdAndYearAndCategory(
            @Param("studentId") Long studentId,
            @Param("year") Year year,
            @Param("category") ActivityCategory category);
}
