package com.example.schoolmate.common.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.repository.handler.ClassroomQueryHandler;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ClassroomRepositoryImpl implements ClassroomRepositoryCustom {
    private final ClassroomQueryHandler classroomQueryHandler;

    @Override
    public Page<Classroom> search(ClassDTO.SearchCondition cond, Pageable pageable) {
        return classroomQueryHandler.search(cond, pageable);
    }
}