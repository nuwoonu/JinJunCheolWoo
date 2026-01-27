package com.example.schoolmate.common.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.entity.Classroom;

public interface ClassroomRepositoryCustom {
    Page<Classroom> search(ClassDTO.SearchCondition cond, Pageable pageable);
}