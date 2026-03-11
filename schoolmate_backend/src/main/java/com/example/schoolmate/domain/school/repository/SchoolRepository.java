package com.example.schoolmate.domain.school.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.schoolmate.domain.school.entity.School;

@Repository
public interface SchoolRepository extends JpaRepository<School, Long> {
    // 표준 학교 코드로 조회
    Optional<School> findBySchoolCode(String schoolCode);

    // 학교 코드 존재 여부 확인
    boolean existsBySchoolCode(String schoolCode);
}
