package com.example.schoolmate.domain.teacher.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.domain.teacher.dto.TeacherDTO;
import com.example.schoolmate.domain.teacher.entity.constant.TeacherStatus;
import com.example.schoolmate.domain.user.entity.User;

public interface TeacherInfoRepositoryCustom {
    Page<User> search(TeacherDTO.TeacherSearchCondition cond, Pageable pageable);

    Optional<User> findTeacherByCode(String code);

    long countByStatus(TeacherStatus status);
}