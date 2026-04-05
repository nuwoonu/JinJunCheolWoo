package com.example.schoolmate.domain.classroom.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.schoolmate.domain.classroom.dto.ClassDTO;
import com.example.schoolmate.domain.classroom.entity.Classroom;

public interface ClassroomRepositoryCustom {
    Page<Classroom> search(ClassDTO.SearchCondition cond, Pageable pageable);
}