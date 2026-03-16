package com.example.schoolmate.domain.school.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.schoolmate.domain.school.entity.School;

@Repository
public interface SchoolRepository extends JpaRepository<School, Long> {
    // 표준 학교 코드로 조회
    Optional<School> findBySchoolCode(String schoolCode);

    // 학교 코드 존재 여부 확인
    boolean existsBySchoolCode(String schoolCode);

    // 여러 학교 코드 일괄 조회 (N+1 방지용)
    List<School> findAllBySchoolCodeIn(Collection<String> schoolCodes);

    // 다중 조건 학교 검색 (null 파라미터는 조건에서 제외)
    @Query("SELECT s FROM School s WHERE " +
           "(:name IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:schoolKind IS NULL OR s.schoolKind = :schoolKind) AND " +
           "(:officeOfEducation IS NULL OR LOWER(s.officeOfEducation) LIKE LOWER(CONCAT('%', :officeOfEducation, '%')))")
    Page<School> searchSchools(
            @Param("name") String name,
            @Param("schoolKind") String schoolKind,
            @Param("officeOfEducation") String officeOfEducation,
            Pageable pageable);
}
