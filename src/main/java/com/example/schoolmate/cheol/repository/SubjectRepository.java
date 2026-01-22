package com.example.schoolmate.cheol.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.common.entity.user.constant.Year;

public interface SubjectRepository extends JpaRepository<Subject, String> {
    Optional<Subject> findByCode(String code);

    List<Subject> findByYear(Year year);

    List<Subject> findByTeacherId(Long teacherId);
}
