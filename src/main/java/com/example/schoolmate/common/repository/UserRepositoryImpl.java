package com.example.schoolmate.common.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.handler.ParentQueryHandler;
import com.example.schoolmate.common.repository.handler.StudentQueryHandler;
import com.example.schoolmate.common.repository.handler.TeacherQueryHandler;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepositoryCustom {
    private final TeacherQueryHandler teacherQueryHandler;
    private final StudentQueryHandler studentQueryHandler;
    private final ParentQueryHandler parentQueryHandler;

    @Override
    public Page<User> searchTeachers(TeacherDTO.TeacherSearchCondition condition, Pageable pageable) {
        return teacherQueryHandler.search(condition, pageable);
    }

    @Override
    public Page<User> searchStudents(StudentDTO.StudentSearchCondition condition, Pageable pageable) {
        return studentQueryHandler.search(condition, pageable);
    }

    @Override
    public Page<ParentInfo> searchParents(ParentDTO.ParentSearchCondition cond, Pageable pageable) {
        return parentQueryHandler.search(cond, pageable);
    }

    @Override
    public Optional<User> findDetailByCode(String code) {
        return studentQueryHandler.findDetailByCode(code);
    }

    @Override
    public boolean existsStudentByCode(String code) {
        return studentQueryHandler.existsByCode(code);
    }

}