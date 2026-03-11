package com.example.schoolmate.common.repository.info.parent;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;

public interface ParentInfoRepositoryCustom {
    Page<ParentInfo> search(ParentDTO.ParentSearchCondition cond, Pageable pageable);

    long countByStatus(ParentStatus status);
}