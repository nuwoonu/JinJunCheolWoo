package com.example.schoolmate.domain.parent.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.schoolmate.domain.parent.entity.ParentInfo;

public interface ParentInfoRepository extends JpaRepository<ParentInfo, Long>, ParentInfoRepositoryCustom {
    boolean existsByCode(String code);
}