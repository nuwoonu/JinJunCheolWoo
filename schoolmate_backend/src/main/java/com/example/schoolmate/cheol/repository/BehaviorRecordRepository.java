package com.example.schoolmate.cheol.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.cheol.entity.BehaviorRecord;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

// [cheol] 행동 특성 및 종합의견 Repository
public interface BehaviorRecordRepository extends JpaRepository<BehaviorRecord, Long> {

    // 학생별 전체 조회
    @Query("SELECT b FROM BehaviorRecord b WHERE b.student.id = :studentId ORDER BY b.year, b.semester")
    List<BehaviorRecord> findByStudentId(@Param("studentId") Long studentId);

    // 학생 + 학년 + 학기 단건 조회
    @Query("SELECT b FROM BehaviorRecord b WHERE b.student.id = :studentId AND b.year = :year AND b.semester = :semester")
    Optional<BehaviorRecord> findByStudentIdAndYearAndSemester(
            @Param("studentId") Long studentId,
            @Param("year") Year year,
            @Param("semester") Semester semester);
}
