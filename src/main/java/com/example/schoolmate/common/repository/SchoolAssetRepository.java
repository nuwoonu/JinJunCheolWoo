package com.example.schoolmate.common.repository;

import com.example.schoolmate.common.entity.SchoolAsset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SchoolAssetRepository extends JpaRepository<SchoolAsset, Long> {
    boolean existsByCode(String code);

    Page<SchoolAsset> findByNameContainingOrCodeContaining(String name, String code, Pageable pageable);
}