package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;

public interface SubjectRepository extends JpaRepository<StudentAssignment, Long> {
    Optional<StudentAssignment> findByCode(String code);

    List<StudentAssignment> findByGrade(int grade);

    List<StudentAssignment> findByTeacher_Id(Long teacherId);
}
