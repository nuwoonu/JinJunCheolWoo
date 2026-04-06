package com.example.schoolmate.domain.resources.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.schoolmate.domain.resources.entity.SchoolFacility;

@Repository
public interface SchoolFacilityRepository extends JpaRepository<SchoolFacility, Long>, SchoolFacilityRepositoryCustom {
    boolean existsBySchool_Id(Long schoolId);
}