package com.example.schoolmate.common.repository.info.teacher;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.User;

public interface TeacherInfoRepositoryCustom {
    Page<User> search(TeacherDTO.TeacherSearchCondition cond, Pageable pageable);

    Optional<User> findTeacherByCode(String code);

    long countByStatus(TeacherStatus status);
}