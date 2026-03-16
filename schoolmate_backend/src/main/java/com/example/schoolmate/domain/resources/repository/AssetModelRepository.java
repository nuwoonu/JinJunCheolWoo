package com.example.schoolmate.domain.resources.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.schoolmate.domain.resources.entity.AssetModel;

@Repository
public interface AssetModelRepository extends JpaRepository<AssetModel, Long> {
    List<AssetModel> findBySchoolId(Long schoolId);
}