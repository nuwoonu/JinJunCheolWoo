package com.example.schoolmate.domain.parent.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.domain.parent.dto.ParentDTO;
import com.example.schoolmate.domain.parent.entity.ParentInfo;

public interface ParentInfoRepositoryCustom {
    Page<ParentInfo> search(ParentDTO.ParentSearchCondition cond, Pageable pageable);
}