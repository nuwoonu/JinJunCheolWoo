package com.example.schoolmate.common.repository.info.student;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.User;

public interface StudentInfoRepositoryCustom {
    Page<User> search(StudentDTO.StudentSearchCondition cond, Pageable pageable);

    Optional<User> findDetailByCode(String code);

    boolean existsByCode(String code);

    List<User> findStudentsByAssignment(int year, int grade, int classNum);

    List<User> findUnassignedStudents(int year, int limit);

    long countByClassroom(int year, int grade, int classNum);

    long countByStatus(StudentStatus status);

    int findMaxAttendanceNum(int year, int grade, int classNum);
}