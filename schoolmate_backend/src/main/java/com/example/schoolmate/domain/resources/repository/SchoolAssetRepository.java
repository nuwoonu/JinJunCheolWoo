package com.example.schoolmate.domain.resources.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.schoolmate.domain.resources.entity.SchoolAsset;

@Repository
public interface SchoolAssetRepository extends JpaRepository<SchoolAsset, Long> {
    boolean existsByAssetCode(String assetCode);

    Page<SchoolAsset> findByNameContainingOrAssetCodeContaining(String name, String assetCode, Pageable pageable);
}