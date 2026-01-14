package com.example.schoolmate.common.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.user.User;

public interface UserRepositoryCustom {
    Page<User> searchTeachers(TeacherDTO.TeacherSearchCondition condition, Pageable pageable);
}
