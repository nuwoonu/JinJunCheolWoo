package com.example.schoolmate.domain.grade.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.grade.entity.Subject;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    boolean existsByCode(String code);
    boolean existsByName(String name);

    boolean existsByCodeAndSchool_Id(String code, Long schoolId);
    boolean existsByNameAndSchool_Id(String name, Long schoolId);

    List<Subject> findAllBySchool_Id(Long schoolId);

    Optional<Subject> findByCodeAndSchool_Id(String code, Long schoolId);
}
