package com.example.schoolmate.common.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.user.User;

public interface UserRepositoryCustom {
    Page<User> searchTeachers(TeacherDTO.TeacherSearchCondition condition, Pageable pageable);

    Page<User> searchStudents(StudentDTO.StudentSearchCondition cond, Pageable pageable);

    Page<ParentInfo> searchParents(ParentDTO.ParentSearchCondition cond, Pageable pageable);

    Optional<User> findDetailByCode(String code);

    boolean existsStudentByCode(String code);
}
