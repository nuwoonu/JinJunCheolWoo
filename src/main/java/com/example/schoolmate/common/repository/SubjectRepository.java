package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.Subject;

public interface SubjectRepository extends JpaRepository<Subject, String> {
    Optional<Subject> findByCode(String code);

    List<Subject> findByGrade(int grade);

    List<Subject> findByTeacher_Uid(Long teacherUid);
}
