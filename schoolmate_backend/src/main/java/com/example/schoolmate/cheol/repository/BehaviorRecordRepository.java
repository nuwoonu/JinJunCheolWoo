package com.example.schoolmate.cheol.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.cheol.entity.BehaviorRecord;

// [cheol] 행동 특성 및 종합의견 Repository
public interface BehaviorRecordRepository extends JpaRepository<BehaviorRecord, Long> {

    // 학생별 전체 조회 (학년도·학기 오름차순)
    @Query("SELECT b FROM BehaviorRecord b WHERE b.student.id = :studentId ORDER BY b.academicTerm.schoolYear.year, b.academicTerm.semester")
    List<BehaviorRecord> findByStudentId(@Param("studentId") Long studentId);

    // 학생 + 학년도(int) + 학기 단건 조회
    @Query("SELECT b FROM BehaviorRecord b WHERE b.student.id = :studentId AND b.academicTerm.schoolYear.year = :year AND b.academicTerm.semester = :semester")
    Optional<BehaviorRecord> findByStudentIdAndYearAndSemester(
            @Param("studentId") Long studentId,
            @Param("year") int year,
            @Param("semester") int semester);
}
